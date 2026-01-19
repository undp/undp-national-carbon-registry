# ADR-001: Knowledge Graph Integration pour ODD Linkage

**Date**: 2024-01-14  
**Statut**: Proposé 🟡  
**Décideurs**: ATLAS Integration Team, UNDP Technical Committee

## Contexte et Problématique

Le UNDP National Carbon Credit Registry v2.0rc1 gère les projets carbone selon l'Article 6 du Paris Agreement, mais **manque de linkage structuré avec les Objectifs de Développement Durable (ODD)**.

### Problèmes Identifiés
1. **Absence de traçabilité ODD** : Aucun champ dans `ProjectEntity` pour lier un projet aux ODD 13 (Climate Action) et 15 (Life on Land)
2. **Validation manuelle** : Les évaluateurs UNDP doivent vérifier manuellement la cohérence ODD → Paris Agreement
3. **Pas de scoring automatisé** : Impossible de classer les projets selon leur impact multi-ODD

### Exemple Concret (Maroc)
**Projet**: "Agroforesterie El Alaoui - 500 ha d'arganiers"
- **ODD Primaires**: 13.1 (Résilience climatique), 13.2 (Politiques climat)
- **ODD Secondaires**: 15.1 (Écosystèmes terrestres), 2.4 (Agriculture durable)
- **NDC Maroc**: Agriculture (40% réduction émissions d'ici 2030)

**Défi ATLAS**: Comment lier automatiquement ce projet à ces ODD via Knowledge Graph ?

## Décision

Implémenter le **@atlas-undp/kg-odd-linker** comme microservice NestJS pour :
1. **Analyser** le contenu textuel du projet (title, description, PDD)
2. **Extraire** les entités nommées (NER) liées aux ODD
3. **Linker** via le Knowledge Graph ATLAS existant (BC-OS-Cortex)
4. **Retourner** les ODD primaires/secondaires avec scores de confiance

### Architecture Choisie

```
┌─────────────────────────────────────────────────────────────┐
│  UNDP Backend (NestJS)                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ProjectEntity (PostgreSQL)                            │  │
│  │ ├── id: string                                        │  │
│  │ ├── title: string                                     │  │
│  │ ├── description: string                               │  │
│  │ ├── odd_links: JSONB ← NOUVEAU                        │  │
│  │ │   ├── primary: ['ODD_13.1', 'ODD_13.2']            │  │
│  │ │   └── secondary: ['ODD_15.1']                       │  │
│  │ └── kg_relations: JSONB ← NOUVEAU                     │  │
│  │     ├── graph_id: 'atlas-kg-maroc-2024'              │  │
│  │     ├── confidence: 0.87                              │  │
│  │     └── last_update: Date                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ATLAS KG Linker Service (libs/atlas-kg/)             │  │
│  │ ├── POST /api/atlas/kg/link-project/:id              │  │
│  │ ├── GET  /api/atlas/kg/validate-odds/:id             │  │
│  │ └── GET  /api/atlas/kg/health                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ATLAS Knowledge Graph (External HTTP API)            │  │
│  │ ├── Endpoint: http://cortex-kg:8080/api/v4/odd       │  │
│  │ ├── Auth: Bearer token (ATLAS_API_KEY)               │  │
│  │ └── Response: { odd_codes, confidence, relations }    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Alternatives Considérées

### Option A: Intégration directe dans UNDP Backend (❌ Rejetée)
- **Avantage**: Pas de nouveau service
- **Inconvénient**: Couplage fort, difficile à maintenir séparément
- **Raison du rejet**: ATLAS doit rester modulaire pour autres registres (Ghana, Rwanda, etc.)

### Option B: Lambda Function AWS (❌ Rejetée)
- **Avantage**: Serverless, scalable
- **Inconvénient**: Vendor lock-in, latence cold start
- **Raison du rejet**: UNDP favorise l'open-source auto-hébergeable

### Option C: Microservice NestJS dans libs/ (✅ Choisie)
- **Avantage**: Réutilisable, testable, compatible architecture UNDP
- **Inconvénient**: Nécessite configuration Nx Workspace
- **Raison du choix**: Aligné avec stack UNDP + philosophie ATLAS (AGPL-3.0)

## Conséquences

### Positives ✅
1. **Traçabilité ODD automatisée** pour 100% des projets
2. **Réduction validation manuelle** de 80% (estimé)
3. **Dashboard UNDP** peut afficher ODD linkage en temps réel
4. **Compatible Article 6** : Prouver l'alignement Paris Agreement via ODD

### Négatives ⚠️
1. **Dépendance externe** : Service ATLAS KG doit être disponible (SLA 99.5%)
2. **Migration données** : Projets existants doivent être re-linkés (batch script)
3. **Performance** : Latence +150ms par création de projet (acceptable pour Phase 1)

### Risques Atténués
- **Fallback Mode** : Si ATLAS KG indisponible → mode dégradé (linkage manuel)
- **Cache Local** : Redis pour stocker mappings fréquents (ODD 13.1 → arganiers Maroc)
- **Rate Limiting** : 100 req/min pour éviter surcharge KG

## Implémentation Phase 1 (Semaines 1-2)

### Semaine 1: Backend Extension
```typescript
// backend/services/libs/shared/src/entities/projects.entity.ts

import { Column, Entity } from 'typeorm';

@Entity()
export class ProjectEntity {
  // ... champs existants ...

  @Column({ type: 'jsonb', nullable: true })
  odd_links?: {
    primary: string[];      // ODD avec impact direct
    secondary: string[];    // ODD avec impact indirect
    metadata: {
      linked_at: Date;
      linker_version: string;  // 'atlas-kg@1.0.0'
      confidence: number;       // 0.0 - 1.0
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  kg_relations?: {
    graph_id: string;        // 'atlas-kg-maroc-2024'
    nodes: Array<{
      type: 'ODD' | 'NDC' | 'PROJECT';
      id: string;
      weight: number;
    }>;
    last_sync: Date;
  };
}
```

### Semaine 2: ATLAS KG Linker Service
```typescript
// libs/atlas-kg/src/kg-linker.service.ts

import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KgLinkerService {
  private readonly ATLAS_KG_URL: string;
  private readonly ATLAS_API_KEY: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.ATLAS_KG_URL = configService.get('ATLAS_KG_URL') || 'http://cortex-kg:8080/api/v4';
    this.ATLAS_API_KEY = configService.get('ATLAS_API_KEY');
  }

  async linkProjectToODD(project: {
    title: string;
    description: string;
    country: string;
  }): Promise<{
    primary: string[];
    secondary: string[];
    confidence: number;
  }> {
    try {
      const response = await this.httpService
        .post(`${this.ATLAS_KG_URL}/odd/link`, {
          text: `${project.title} ${project.description}`,
          country: project.country,
          context: 'carbon_credit',
        }, {
          headers: {
            'Authorization': `Bearer ${this.ATLAS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })
        .toPromise();

      return {
        primary: response.data.odd_codes.filter(o => o.confidence > 0.75),
        secondary: response.data.odd_codes.filter(o => o.confidence <= 0.75),
        confidence: response.data.global_confidence,
      };
    } catch (error) {
      // Fallback mode: retourner ODD par défaut pour carbon projects
      console.warn('ATLAS KG unavailable, using fallback', error);
      return {
        primary: ['ODD_13.1'],  // Toujours lié au climat
        secondary: [],
        confidence: 0.5,  // Low confidence en mode dégradé
      };
    }
  }
}
```

## Validation et Tests

### Tests Unitaires (Jest)
```typescript
describe('KgLinkerService', () => {
  it('should link Morocco agroforestry project to ODD 13.1, 13.2, 15.1', async () => {
    const project = {
      title: 'Agroforesterie El Alaoui',
      description: '500 hectares d\'arganiers pour séquestration carbone',
      country: 'MA',
    };

    const result = await service.linkProjectToODD(project);

    expect(result.primary).toContain('ODD_13.1');
    expect(result.primary).toContain('ODD_13.2');
    expect(result.secondary).toContain('ODD_15.1');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

### Tests d'Intégration (Supertest)
```typescript
describe('POST /api/atlas/kg/link-project/:id', () => {
  it('should return 200 with ODD links', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/atlas/kg/link-project/PROJECT_123')
      .set('Authorization', 'Bearer VALID_TOKEN')
      .expect(200);

    expect(response.body).toHaveProperty('odd_links');
    expect(response.body.odd_links.primary).toBeInstanceOf(Array);
  });
});
```

## Métriques de Succès

| Métrique | Target Phase 1 | Mesure |
|----------|----------------|--------|
| **Couverture ODD** | 100% projets | COUNT(odd_links IS NOT NULL) / COUNT(*) |
| **Temps de réponse** | < 200ms | AVG(link_duration_ms) |
| **Précision linkage** | > 85% | Validation manuelle sur 50 projets |
| **Disponibilité** | > 99% | Uptime service ATLAS KG |

## Prochaines Étapes (Post-Phase 1)

1. **Phase 2**: Ajouter NER Scorer pour détection automatique entités Maroc (arganiers, oasis, etc.)
2. **Phase 3**: Intégrer ML Bridge (atlas_sovereignty_dt_v4.pkl) pour validation souveraine
3. **Phase 4**: Dashboard UNDP avec visualisation graphe ODD (D3.js)

## Références

- UNDP ProjectEntity Schema: `backend/services/libs/shared/src/entities/projects.entity.ts`
- ATLAS KG API Reference: [docs/atlas/atlas-kg-api-reference.md](atlas-kg-api-reference.md)
- ATLAS Integration Spec: [specs/atlas/atlas-kg-api-spec.yaml](../../specs/atlas/atlas-kg-api-spec.yaml)
- ODD Framework (UN): https://sdgs.un.org/goals
- Article 6 Paris Agreement: https://unfccc.int/process/the-paris-agreement/cooperative-implementation
- ATLAS v4.11.0 Source: https://github.com/aguennoune/atlas-system (workspace externe)

---

**Auteur**: ATLAS Integration Team  
**Reviewers**: UNDP Technical Lead, BioContinuum OS Architect  
**Statut Approbation**: En attente validation UNDP
