# @atlas-undp/kg - Knowledge Graph ODD Linker

## 📋 Description

Service NestJS pour lier automatiquement les projets UNDP Carbon Registry aux Objectifs de Développement Durable (ODD/SDG) via le Knowledge Graph ATLAS v4.11.0.

**Phase 1**: Proof of Concept (Semaines 1-2)  
**Version**: 1.0.0  
**Licence**: AGPL-3.0

## 🎯 Fonctionnalités

- ✅ **Linkage ODD automatisé** : Analyse NLP du projet → ODD primaires/secondaires
- ✅ **Mode fallback** : Mapping par secteur si ATLAS KG indisponible
- ✅ **Validation ODD** : Vérification cohérence climate action (ODD 13.x)
- ✅ **Health check** : Monitoring connectivité ATLAS KG
- ✅ **KG Relations** : Construction graphe relations projet ↔ ODD ↔ NDC

## 🚀 Installation

```bash
cd libs/atlas-kg
npm install
```

## 🛠️ Configuration

Créer `.env` à la racine du projet UNDP :

```env
ATLAS_KG_URL=http://cortex-kg:8080/api/v4
ATLAS_API_KEY=your_atlas_api_key_here
```

## 📖 Utilisation

### Import dans UNDP Backend

```typescript
// backend/src/app.module.ts
import { AtlasKgModule } from '../../libs/atlas-kg/src';

@Module({
  imports: [
    // ... autres modules UNDP
    AtlasKgModule,
  ],
})
export class AppModule {}
```

### API Endpoints

#### 1. Link Project to ODD

```bash
POST /api/atlas/kg/link-project/:projectId
Content-Type: application/json

{
  "title": "Agroforesterie El Alaoui",
  "description": "500 hectares d'arganiers pour séquestration carbone",
  "country": "MA",
  "sector": "Forestry"
}
```

**Response**:
```json
{
  "project_id": "PROJECT_123",
  "odd_links": {
    "primary": ["ODD_13.1", "ODD_13.2", "ODD_15.1"],
    "secondary": ["ODD_2.4"],
    "confidence": 0.87,
    "metadata": {
      "linked_at": "2024-01-14T10:30:00Z",
      "linker_version": "atlas-kg@1.0.0",
      "fallback_mode": false
    }
  },
  "kg_relations": {
    "graph_id": "atlas-kg-ma-2024",
    "nodes": [
      { "type": "PROJECT", "id": "PROJECT_123", "weight": 1.0 },
      { "type": "ODD", "id": "ODD_13.1", "weight": 0.9 }
    ],
    "last_sync": "2024-01-14T10:30:00Z"
  }
}
```

#### 2. Validate ODD Links

```bash
GET /api/atlas/kg/validate-odds/:projectId
Content-Type: application/json

{
  "odd_links": {
    "primary": ["ODD_13.1"],
    "secondary": [],
    "confidence": 0.85,
    "metadata": { ... }
  }
}
```

**Response**:
```json
{
  "project_id": "PROJECT_123",
  "validation": {
    "valid": true,
    "warnings": [],
    "score": 1.0
  }
}
```

#### 3. Health Check

```bash
GET /api/atlas/kg/health
```

**Response**:
```json
{
  "status": "healthy",
  "atlas_kg_reachable": true,
  "response_time_ms": 120,
  "version": "1.0.0"
}
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:cov

# Tests en mode watch
npm run test:watch
```

### Exemples de Tests

```typescript
describe('KgLinkerService', () => {
  it('should link Morocco agroforestry to ODD 13.1, 15.1', async () => {
    const project = {
      id: 'PROJECT_123',
      title: 'Agroforesterie El Alaoui',
      description: '500 hectares d\'arganiers',
      country: 'MA',
      sector: 'Forestry',
    };

    const result = await service.linkProjectToODD(project);

    expect(result.primary).toContain('ODD_13.1');
    expect(result.primary).toContain('ODD_15.1');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

## 📊 ODD Mapping (Maroc)

| Secteur | ODD Primaires | ODD Secondaires |
|---------|---------------|-----------------|
| **Agriculture** | 2.4, 13.1 | 15.1 |
| **Foresterie** | 13.1, 15.1, 15.2 | 2.4 |
| **Énergie** | 7.2, 13.1 | 9.4 |
| **Transport** | 11.2, 13.1 | 9.1 |
| **Déchets** | 12.5, 13.1 | 11.6 |

## 🔧 Intégration Backend UNDP

### Extension ProjectEntity

```typescript
// backend/services/libs/shared/src/entities/projects.entity.ts

import { Column } from 'typeorm';

@Entity()
export class ProjectEntity {
  // ... champs existants ...

  @Column({ type: 'jsonb', nullable: true })
  odd_links?: {
    primary: string[];
    secondary: string[];
    metadata: {
      linked_at: Date;
      linker_version: string;
      confidence: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  kg_relations?: {
    graph_id: string;
    nodes: Array<{
      type: 'ODD' | 'NDC' | 'PROJECT';
      id: string;
      weight: number;
    }>;
    last_sync: Date;
  };
}
```

### Service Call dans Project Creation

```typescript
// backend/services/src/project/project.service.ts

import { KgLinkerService } from '../../../libs/atlas-kg/src';

@Injectable()
export class ProjectService {
  constructor(private kgLinkerService: KgLinkerService) {}

  async createProject(dto: CreateProjectDto): Promise<ProjectEntity> {
    // 1. Créer projet UNDP (logic existante)
    const project = await this.projectRepository.save({
      title: dto.title,
      description: dto.description,
      country: dto.country,
      // ...
    });

    // 2. Linker vers ODD via ATLAS KG
    const oddLinks = await this.kgLinkerService.linkProjectToODD({
      id: project.id,
      title: project.title,
      description: project.description,
      country: project.country,
      sector: dto.sector,
    });

    const kgRelations = await this.kgLinkerService.buildKgRelations(
      project,
      oddLinks,
    );

    // 3. Mettre à jour avec ODD
    project.odd_links = oddLinks;
    project.kg_relations = kgRelations;
    await this.projectRepository.save(project);

    return project;
  }
}
```

## 📚 Références

- **ADR-001**: [Architecture Decision Record](../../docs/atlas/ADR-001-KG-Integration.md)
- **ATLAS v4.11.0**: `/BC-OS-Cortex/biolab-mcp-research-server/README.md`
- **UNDP Registry**: https://github.com/undp/national-carbon-registry
- **ODD Framework**: https://sdgs.un.org/goals

## 🤝 Contribution

Phase 1 = Proof of Concept → Validation manuelle sur 50 projets Maroc  
Phase 2 = NER Scorer + NDC Router (Semaines 3-10)  
Phase 3 = ML Bridge (atlas_sovereignty_dt_v4.pkl) (Semaines 11-18)

## 📝 Licence

AGPL-3.0 - Compatible avec UNDP National Carbon Registry

---

**Auteur**: ATLAS Integration Team  
**Contact**: aguennoune@biocontinuum-os  
**Version**: 1.0.0 (Phase 1 - POC)
