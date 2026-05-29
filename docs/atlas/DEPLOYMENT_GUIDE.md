# Guide de Déploiement ATLAS × UNDP - Phase 1

## 🎯 Objectif Phase 1

Déployer le **@atlas-undp/kg-odd-linker** dans le UNDP Carbon Registry v2.0rc1 pour valider le Proof of Concept (POC).

**Durée**: 2 semaines  
**Cible**: Projets Maroc (agroforesterie, foresterie)  
**Success Metric**: 100% projets linkés vers ODD avec confiance > 0.7

---

## 📋 Prérequis

### Infrastructure
- ✅ UNDP Carbon Registry v2.0rc1 déployé
- ✅ PostgreSQL 14+ (pour JSONB support)
- ✅ Node.js 18+ / npm 9+
- ✅ ATLAS Knowledge Graph API accessible (http://cortex-kg:8080)

### Accès
- ✅ Credentials PostgreSQL (UNDP DB)
- ✅ ATLAS API Key (`ATLAS_API_KEY`)
- ✅ Git access à `aguennoune/undp-national-carbon-registry` (branche `feature/atlas-integration`)

---

## 🚀 Étape 1: Configuration Environnement

### 1.1 Variables d'environnement

Créer `.env` à la racine du projet UNDP :

```bash
cd /home/aguennoune/stack-humhub-docker/atlas-system/nx-nano-datacenter/packages/undp-carbon-registry

cat > .env << 'EOF'
# UNDP Database (existant)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=undp_carbon_registry

# ATLAS Integration (nouveau)
ATLAS_KG_URL=http://cortex-kg:8080/api/v4
ATLAS_API_KEY=your_atlas_api_key_here
ATLAS_KG_TIMEOUT_MS=5000

# Feature Flags
ENABLE_ATLAS_ODD_LINKAGE=true
ATLAS_FALLBACK_MODE=true
EOF
```

### 1.2 Vérifier ATLAS KG Connectivity

```bash
# Test health endpoint ATLAS KG
curl http://cortex-kg:8080/api/v4/health

# Expected: { "status": "ok", "version": "4.11.0-lts-quantique" }
```

---

## 🛠️ Étape 2: Installation Dépendances

### 2.1 Installer @atlas-undp/kg

```bash
cd libs/atlas-kg
npm install

# Vérifier dependencies
npm ls
```

### 2.2 Build TypeScript

```bash
npm run build

# Output attendu: dist/index.js, dist/index.d.ts
ls -la dist/
```

---

## 🗄️ Étape 3: Migration Base de Données

### 3.1 Générer migration TypeORM

```bash
cd ../..  # Revenir à racine UNDP

# Copier migration dans backend
cp libs/atlas-kg/migrations/1705228800000-AddAtlasOddLinkage.ts \
   backend/services/src/migrations/

# Vérifier migration présente
ls backend/services/src/migrations/
```

### 3.2 Exécuter migration

```bash
# Run migration
npm run migration:run

# Expected output:
# ✅ Added column: project.odd_links (JSONB)
# ✅ Added column: project.kg_relations (JSONB)
# ✅ Created GIN index: idx_project_odd_links
# ✅ Created GIN index: idx_project_kg_relations
```

### 3.3 Vérifier schéma PostgreSQL

```sql
-- Se connecter à PostgreSQL
psql -U postgres -d undp_carbon_registry

-- Vérifier colonnes ajoutées
\d project

-- Expected:
-- odd_links     | jsonb | nullable
-- kg_relations  | jsonb | nullable

-- Vérifier index
\di idx_project_odd_links
\di idx_project_kg_relations

-- Quitter
\q
```

---

## 🔧 Étape 4: Intégration Backend UNDP

### 4.1 Importer AtlasKgModule

Éditer `backend/src/app.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { AtlasKgModule } from '../libs/atlas-kg/src';  // ← NOUVEAU

@Module({
  imports: [
    // ... modules UNDP existants (TypeOrmModule, ConfigModule, etc.)
    
    AtlasKgModule,  // ← NOUVEAU: ATLAS KG ODD Linker
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### 4.2 Injecter KgLinkerService dans ProjectService

Éditer `backend/services/src/project/project.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { KgLinkerService } from '../../../libs/atlas-kg/src';  // ← NOUVEAU

@Injectable()
export class ProjectService {
  constructor(
    // ... injections existantes (ProjectRepository, etc.)
    
    private kgLinkerService: KgLinkerService,  // ← NOUVEAU
  ) {}

  async createProject(dto: CreateProjectDto): Promise<ProjectEntity> {
    // 1. Logic UNDP existante (créer projet)
    const project = await this.projectRepository.save({
      title: dto.title,
      description: dto.description,
      country: dto.country,
      // ... autres champs
    });

    // 2. ATLAS ODD Linkage (nouveau)
    if (process.env.ENABLE_ATLAS_ODD_LINKAGE === 'true') {
      try {
        const oddLinks = await this.kgLinkerService.linkProjectToODD({
          id: project.id,
          title: project.title,
          description: project.description,
          country: project.country,
          sector: dto.sector,
        });

        const kgRelations = await this.kgLinkerService.buildKgRelations(
          { id: project.id, ...dto },
          oddLinks,
        );

        // 3. Sauvegarder ODD links
        project.odd_links = oddLinks;
        project.kg_relations = kgRelations;
        await this.projectRepository.save(project);
        
        console.log(`✅ Project ${project.id} linked to ${oddLinks.primary.length} ODD`);
      } catch (error) {
        console.error('⚠️ ATLAS ODD linkage failed (non-blocking)', error);
      }
    }

    return project;
  }
}
```

---

## 🧪 Étape 5: Tests Unitaires

### 5.1 Run tests @atlas-undp/kg

```bash
cd libs/atlas-kg
npm run test

# Expected: 
# ✅ KgLinkerService › linkProjectToODD › should link Morocco agroforestry
# ✅ KgLinkerService › buildKgRelations › should build correct KG structure
# ✅ KgLinkerService › validateOddLinks › should validate correct ODD links
# PASS  10 tests
```

### 5.2 Coverage report

```bash
npm run test:cov

# Target: > 80% coverage (branches, functions, lines)
```

---

## 🌐 Étape 6: Démarrage Serveur

### 6.1 Start UNDP Backend

```bash
cd ../..  # Racine UNDP
npm run start:dev

# Expected logs:
# [Nest] INFO [AtlasKgModule] KG Linker initialized: http://cortex-kg:8080/api/v4
# [Nest] INFO [AppModule] UNDP Carbon Registry started on port 3000
```

### 6.2 Vérifier Health Check

```bash
curl http://localhost:3000/api/atlas/kg/health

# Expected:
# {
#   "status": "healthy",
#   "atlas_kg_reachable": true,
#   "response_time_ms": 120,
#   "version": "1.0.0"
# }
```

---

## ✅ Étape 7: Test d'Intégration End-to-End

### 7.1 Créer projet test (Agroforesterie Maroc)

```bash
curl -X POST http://localhost:3000/api/atlas/kg/link-project/TEST_PROJECT_001 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Agroforesterie El Alaoui - Arganiers",
    "description": "Plantation de 500 hectares d'\''arganiers dans la région de Souss-Massa pour séquestration carbone et restauration écosystèmes",
    "country": "MA",
    "sector": "Forestry"
  }'

# Expected response:
# {
#   "project_id": "TEST_PROJECT_001",
#   "odd_links": {
#     "primary": ["ODD_13.1", "ODD_13.2", "ODD_15.1"],
#     "secondary": ["ODD_2.4"],
#     "confidence": 0.87,
#     "metadata": {
#       "linked_at": "2024-01-14T10:30:00Z",
#       "linker_version": "atlas-kg@1.0.0",
#       "fallback_mode": false
#     }
#   },
#   "kg_relations": {
#     "graph_id": "atlas-kg-ma-2024",
#     "nodes": [...],
#     "last_sync": "2024-01-14T10:30:00Z"
#   }
# }
```

### 7.2 Valider ODD linkage

```bash
curl http://localhost:3000/api/atlas/kg/validate-odds/TEST_PROJECT_001 \
  -X GET \
  -H "Content-Type: application/json" \
  -d '{
    "odd_links": {
      "primary": ["ODD_13.1", "ODD_15.1"],
      "secondary": [],
      "confidence": 0.87,
      "metadata": {
        "linked_at": "2024-01-14T10:30:00Z",
        "linker_version": "atlas-kg@1.0.0",
        "fallback_mode": false
      }
    }
  }'

# Expected:
# {
#   "project_id": "TEST_PROJECT_001",
#   "validation": {
#     "valid": true,
#     "warnings": [],
#     "score": 1.0
#   }
# }
```

### 7.3 Vérifier dans PostgreSQL

```sql
-- Vérifier ODD links dans DB
SELECT id, title, odd_links, kg_relations 
FROM project 
WHERE id = 'TEST_PROJECT_001';

-- Expected: Colonnes JSONB remplies avec ODD codes
```

---

## 📊 Étape 8: Validation Phase 1

### 8.1 Success Metrics Checklist

| Métrique | Target | Actuel | Status |
|----------|--------|--------|--------|
| **Couverture ODD** | 100% projets | ? | ⏳ |
| **Temps réponse** | < 200ms | ? | ⏳ |
| **Précision linkage** | > 85% | ? | ⏳ |
| **Tests unitaires** | > 80% coverage | ? | ⏳ |

### 8.2 Tester 50 projets Maroc

```bash
# Script batch pour tester 50 projets existants
node scripts/batch-link-odd.js

# Output attendu:
# ✅ 50/50 projects linked successfully
# ✅ Average confidence: 0.82
# ✅ Average response time: 145ms
```

---

## 🔍 Monitoring & Debugging

### Health Check Endpoint

```bash
# Vérifier status ATLAS KG
watch -n 5 curl http://localhost:3000/api/atlas/kg/health
```

### Logs Backend

```bash
# Suivre logs ATLAS integration
tail -f logs/undp-backend.log | grep "ATLAS\|KgLinker"
```

### Mode Fallback

Si ATLAS KG indisponible :

```bash
# Activer fallback mode explicite
export ATLAS_FALLBACK_MODE=true

# Redémarrer serveur
npm run start:dev

# Vérifier: odd_links.metadata.fallback_mode = true
```

---

## 🚧 Rollback Plan

### Si migration échoue

```bash
# Rollback migration
npm run migration:revert

# Expected:
# ✅ Dropped column: project.odd_links
# ✅ Dropped column: project.kg_relations
# ✅ Dropped index: idx_project_odd_links
```

### Si service ATLAS KG pose problème

```bash
# Désactiver feature flag
export ENABLE_ATLAS_ODD_LINKAGE=false

# Redémarrer (UNDP continue sans ATLAS)
npm run start:dev
```

---

## 📝 Next Steps (Post-Phase 1)

1. **Phase 2** (Semaines 3-10): NER Scorer + NDC Router
2. **Phase 3** (Semaines 11-18): ML Bridge (atlas_sovereignty_dt_v4.pkl)
3. **Phase 4** (Semaines 19-22): Production + Monitoring Grafana

---

## 📚 Références

- **Plan d'Intégration Complet**: `ATLAS-UNDP-Integration-Plan.md`
- **ADR-001 KG Integration**: `docs/atlas/ADR-001-KG-Integration.md`
- **API Spec**: `specs/atlas/atlas-kg-api-spec.yaml`
- **README @atlas-undp/kg**: `libs/atlas-kg/README.md`

---

**Auteur**: ATLAS Integration Team  
**Version**: 1.0.0 (Phase 1 - POC)  
**Date**: 2024-01-14
