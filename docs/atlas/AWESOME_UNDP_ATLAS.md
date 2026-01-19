# Awesome UNDP Carbon Registry × ATLAS Integration 🌍

[![AGPL-3.0 License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![UNDP v2.0rc1](https://img.shields.io/badge/UNDP-v2.0rc1-blue)](https://github.com/undp/national-carbon-registry)
[![ATLAS v4.11.0](https://img.shields.io/badge/ATLAS-v4.11.0--lts--quantique-green)](https://github.com/aguennoune/atlas-system)

> 📚 Une liste curée de ressources, outils, documentation et intégrations pour le UNDP National Carbon Credit Registry avec le framework ATLAS.

**🌐 Languages**: **🇫🇷 Français** | [🇺🇸 English](AWESOME_UNDP_ATLAS_EN.md)

**Vision**: Démocratiser l'accès aux marchés carbone via blockchain, Article 6 du Paris Agreement, et validation souveraine par Knowledge Graph.

---

## 📖 Table des Matières

- [Ressources Officielles](#-ressources-officielles)
- [Architecture & Design](#-architecture--design)
- [Intégrations ATLAS](#-intégrations-atlas)
- [APIs & Services](#-apis--services)
- [Documentation Technique](#-documentation-technique)
- [Outils de Développement](#-outils-de-développement)
- [Déploiement & DevOps](#-déploiement--devops)
- [Cas d'Usage & Études](#-cas-dusage--études)
- [Standards & Compliance](#-standards--compliance)
- [Communauté & Support](#-communauté--support)
- [Projets Connexes](#-projets-connexes)

---

## 🌐 Ressources Officielles

### UNDP Carbon Registry

- **Repository Principal**: [undp/national-carbon-registry](https://github.com/undp/national-carbon-registry)
- **Documentation**: [UNDP Carbon Registry Docs](https://github.com/undp/national-carbon-registry/tree/main/documention)
- **Version Actuelle**: v2.0rc1
- **Déploiements**:
  - 🇱🇰 Sri Lanka (Production)
  - 🇬🇭 Ghana (Pilote)
  - 🇻🇺 Vanuatu (En cours)
  - 🇨🇮 Côte d'Ivoire (Planifié)

### ATLAS Framework

- **Repository**: [aguennoune/atlas-system](https://github.com/aguennoune/atlas-system)
- **Version**: v4.11.0-lts-quantique
- **Stack**: Python + NestJS + PostgreSQL + Knowledge Graph
- **Licence**: AGPL-3.0

---

## 🏗️ Architecture & Design

### UNDP Registry Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript)                          │
│  ├── Dashboard (Analytics, Charts)                      │
│  ├── Project Management (PDD, Validation)               │
│  ├── Credit Transfer (Article 6 ITMO)                   │
│  └── Company Management (Roles, Permissions)            │
└─────────────────────────────────────────────────────────┘
                      ↓ REST API
┌─────────────────────────────────────────────────────────┐
│  Backend (NestJS + TypeORM)                             │
│  ├── National API (Projects, Credits, Transfers)        │
│  ├── Analytics API (MRV Dashboard, GHG Inventory)       │
│  ├── Async Operations (Queue Handler, Batch Jobs)       │
│  └── Data Importer (ITMO System, Annual Reports)        │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│  Data Layer                                             │
│  ├── PostgreSQL 14+ (Operational DB)                    │
│  ├── Amazon QLDB (Immutable Ledger)                     │
│  └── S3 / Local Storage (Documents, PDFs)               │
└─────────────────────────────────────────────────────────┘
```

### ATLAS Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│  UNDP ProjectEntity (PostgreSQL)                        │
│  ├── odd_links: JSONB (ODD primaires/secondaires)       │
│  ├── kg_relations: JSONB (Knowledge Graph nodes)        │
│  └── ndc_mapping: JSONB (NDC country alignment)         │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│  @atlas-undp/kg (NestJS Library)                        │
│  ├── KgLinkerService (ODD linkage via ATLAS KG)         │
│  ├── NerScorerService (Named Entity Recognition)        │
│  ├── NdcRouterService (NDC routing Maroc)               │
│  └── MlBridgeService (ML validation via PyCaret)        │
└─────────────────────────────────────────────────────────┘
                      ↓ HTTP API
┌─────────────────────────────────────────────────────────┐
│  ATLAS Knowledge Graph v4.11.0                          │
│  ├── ODD Ontology (17 objectifs SDG)                    │
│  ├── NER Engine (Maroc: arganiers, cèdres, oasis)       │
│  ├── ML Bridge (PyCaret Decision Tree)                  │
│  └── Quantum Eraser Protocol (Debt transformation)      │
└─────────────────────────────────────────────────────────┘
```

**Diagramme Architecture Complète**: [documention/System Architecture.svg](https://github.com/undp/national-carbon-registry/blob/main/documention/imgs/System%20Architecture.svg)

---

## 🔗 Intégrations ATLAS

### Phase 1: Knowledge Graph ODD Linker (✅ Complétée)

**Status**: POC Deployed on `feature/atlas-integration`

**Fonctionnalités**:
- Linkage automatique projets → ODD via NLP
- Mode fallback (secteur-based mapping)
- Validation ODD avec warnings
- Health check ATLAS KG connectivity

**Documentation**:
- [ADR-001: KG Integration](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/ADR-001-KG-Integration.md)
- [Deployment Guide](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/DEPLOYMENT_GUIDE.md)
- [API Reference](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/atlas-kg-api-reference.md)

**Code**:
```bash
libs/atlas-kg/
├── src/
│   ├── kg-linker.service.ts       # Service principal
│   ├── kg-linker.controller.ts    # REST API controller
│   ├── atlas-kg.module.ts         # NestJS module
│   └── kg-linker.service.spec.ts  # Tests unitaires (Jest)
├── migrations/
│   └── 1705228800000-AddAtlasOddLinkage.ts
├── package.json
└── README.md
```

**Endpoints**:
```typescript
POST /api/atlas/kg/link-project/:id      // Link projet → ODD
GET  /api/atlas/kg/validate-odds/:id     // Validation ODD
GET  /api/atlas/kg/health                // Health check
```

### Phase 2: NER Scorer + NDC Router (🔄 En développement)

**Target**: Semaines 3-10

**Fonctionnalités prévues**:
- NER Morocco-specific (arganiers, cèdres, oasis)
- NDC Router (3 NDCs Maroc: Agriculture, Foresterie, Migration)
- Carbon_NER formula scoring (Tier 1/2/3 classification)
- Cache Redis pour mappings fréquents

### Phase 3: ML Validation Engine (⏳ Planifié)

**Target**: Semaines 11-18

**Fonctionnalités prévues**:
- ML Bridge (atlas_sovereignty_dt_v4.pkl adapter)
- Quantum Eraser protocol (debt transformation)
- Dashboard UI avec visualisation graphe ODD (D3.js)
- Sovereign carbon credit validation

### Phase 4: Production Deployment (⏳ Planifié)

**Target**: Semaines 19-22

**Livrables**:
- CI/CD pipelines (GitHub Actions)
- Monitoring Grafana + Prometheus
- Documentation finale + guides utilisateurs
- Formation équipes UNDP

---

## 🔌 APIs & Services

### UNDP Carbon Registry API

**Base URL**: `https://carbon-registry.undp.org/api`

**Principales Endpoints**:
```typescript
// Projects
GET    /projects                    // Liste projets
POST   /projects                    // Créer projet
GET    /projects/:id                // Détails projet
PUT    /projects/:id                // Mettre à jour projet

// Credits
GET    /credits/balance            // Balance crédits
POST   /credits/transfer           // Transférer crédits
POST   /credits/retire             // Retirer crédits

// Companies
GET    /companies                  // Liste organisations
POST   /companies                  // Créer organisation
GET    /companies/:id              // Détails organisation

// Analytics
GET    /analytics/dashboard        // Dashboard MRV
GET    /analytics/ghg-inventory    // Inventaire GHG
```

**Authentification**: JWT Bearer Token

**Documentation API**: Swagger UI disponible sur `/api/docs`

### ATLAS Knowledge Graph API

**Base URL**: `http://cortex-kg:8080/api/v4`

**Endpoints**:
```typescript
// ODD Linkage
POST   /odd/link                   // Link projet → ODD
GET    /odd/validate               // Valider ODD linkage

// NER Scoring
POST   /ner/score                  // Score entités nommées
GET    /ner/entities/:country      // Liste entités pays

// NDC Routing
POST   /ndc/route                  // Router projet → NDC
GET    /ndc/list/:country          // Liste NDCs pays

// Health
GET    /health                     // Health check API
```

**Authentification**: Bearer Token (ATLAS_API_KEY)

**Documentation**: [docs/atlas/atlas-kg-api-reference.md](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/atlas-kg-api-reference.md)

---

## 📚 Documentation Technique

### Guides de Démarrage

- **UNDP Setup**: [README.md](https://github.com/undp/national-carbon-registry/blob/main/README.md)
- **Backend Setup**: [backend/services/README.md](https://github.com/undp/national-carbon-registry/blob/main/backend/services/README.md)
- **Frontend Setup**: [web/README.md](https://github.com/undp/national-carbon-registry/blob/main/web/README.md)
- **ATLAS Integration**: [docs/atlas/DEPLOYMENT_GUIDE.md](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/DEPLOYMENT_GUIDE.md)

### Architecture Decision Records (ADRs)

- **ADR-001**: [Knowledge Graph Integration](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/ADR-001-KG-Integration.md)
- **ADR-002**: NER Scorer Architecture (Coming soon)
- **ADR-003**: NDC Router Design (Coming soon)
- **ADR-004**: ML Bridge Integration (Coming soon)

### Spécifications API

- **OpenAPI 3.0 Spec**: [specs/atlas/atlas-kg-api-spec.yaml](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/specs/atlas/atlas-kg-api-spec.yaml)
- **ATLAS KG Reference**: [docs/atlas/atlas-kg-api-reference.md](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/atlas-kg-api-reference.md)

### Diagrammes & Schémas

- **System Architecture**: [documention/imgs/System Architecture.svg](https://github.com/undp/national-carbon-registry/blob/main/documention/imgs/System%20Architecture.svg)
- **ITMO × Carbon Lifecycle**: [documention/imgs/ITMOxCARBON_LifeCycle.svg](https://github.com/undp/national-carbon-registry/blob/main/documention/imgs/ITMOxCARBON_LifeCycle.svg)
- **Ledger Architecture**: [documention/imgs/Ledger.png](https://github.com/undp/national-carbon-registry/blob/main/documention/imgs/Ledger.png)

---

## 🛠️ Outils de Développement

### Backend (NestJS)

**Technologies**:
- NestJS 10.x (Framework)
- TypeORM 0.3.x (ORM)
- PostgreSQL 14+ (Database)
- Amazon QLDB (Ledger)
- Jest (Tests)

**Configuration**:
```bash
# Installation
cd backend/services
npm install

# Migration DB
npm run migration:run

# Tests
npm run test
npm run test:cov

# Démarrage
npm run start:dev
```

**Variables d'environnement**:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=undp_carbon_registry

# ATLAS Integration
ATLAS_KG_URL=http://cortex-kg:8080/api/v4
ATLAS_API_KEY=your_atlas_api_key_here
ENABLE_ATLAS_ODD_LINKAGE=true
```

### Frontend (React)

**Technologies**:
- React 18.x
- TypeScript 5.x
- Ant Design (UI Components)
- Recharts (Charts)
- i18next (Internationalisation)

**Configuration**:
```bash
# Installation
cd web
npm install

# Démarrage dev
npm run dev

# Build production
npm run build
```

### ATLAS Libraries

**@atlas-undp/kg** (Knowledge Graph ODD Linker):
```bash
cd libs/atlas-kg
npm install
npm run build
npm run test
```

**Dependencies**:
- `@nestjs/common`: ^10.0.0
- `@nestjs/axios`: ^3.0.0
- `axios`: ^1.4.0
- `class-validator`: ^0.14.0

---

## 🚀 Déploiement & DevOps

### Docker Deployment

**UNDP Stack**:
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Vérifier logs
docker-compose logs -f backend
docker-compose logs -f web
```

**Fichiers Docker**:
- [docker-compose.yml](https://github.com/undp/national-carbon-registry/blob/main/docker-compose.yml)
- [backend/Dockerfile](https://github.com/undp/national-carbon-registry/blob/main/backend/services/Dockerfile)
- [web/Dockerfile](https://github.com/undp/national-carbon-registry/blob/main/web/Dockerfile)

### AWS Deployment

**CloudFormation Templates**:
- [deployment/aws-formation.yml](https://github.com/undp/national-carbon-registry/blob/main/deployment/aws-formation.yml)
- [deployment/aws-formation-all-systems.yml](https://github.com/undp/national-carbon-registry/blob/main/deployment/aws-formation-all-systems.yml)

**Services utilisés**:
- EC2 (Backend hosting)
- RDS PostgreSQL (Database)
- QLDB (Ledger)
- S3 (Document storage)
- CloudFront (CDN)

### CI/CD

**GitHub Actions** (À venir):
```yaml
# .github/workflows/atlas-integration.yml
name: ATLAS Integration CI/CD

on:
  push:
    branches: [feature/atlas-integration]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test @atlas-undp/kg
        run: |
          cd libs/atlas-kg
          npm install
          npm run test:cov
```

---

## 📊 Cas d'Usage & Études

### Maroc - Agroforesterie & Carbone

**Contexte**:
- 3 NDCs Maroc: Agriculture (40% réduction), Foresterie (15%), Migration Climatique (5,000 familles)
- Projets pilotes: Arganiers Souss-Massa, Cèdres Atlas, Oasis Drâa-Tafilalet

**ATLAS Integration**:
- ODD Primaires: 13.1 (Climat), 13.2 (Politiques), 15.1 (Écosystèmes)
- ODD Secondaires: 2.4 (Agriculture durable)
- NER Entities: arganiers, cèdres, oasis, séquestration

**Documentation**:
- [ATLAS-UNDP Integration Plan](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/ATLAS-UNDP-Integration-Plan.md)
- [Climate Migration Reintegration](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/ATLAS-UNDP-Integration-Plan.md#phase-16-climate-migration-reintegration)

### Sri Lanka - Production Deployment

**Status**: ✅ Live on Production

**Features**:
- MRV Dashboard (Monitoring, Reporting, Verification)
- GHG Inventory tracking
- Credit transfer marketplace
- Article 6 ITMO compliance

**Metrics**:
- 100+ projets enregistrés
- 500,000+ crédits carbone émis
- 50+ organisations actives

---

## 📜 Standards & Compliance

### Article 6 Paris Agreement

**Documentation officielle**:
- [UNFCCC Article 6](https://unfccc.int/process/the-paris-agreement/cooperative-implementation)
- [ITMO System Integration](https://github.com/undp/national-carbon-registry/blob/main/documention/ITMOxCARBON_LifeCycle.drawio)

**Implémentation UNDP**:
- ITMO tracking (Internationally Transferred Mitigation Outcomes)
- Corresponding adjustments
- Authorization letters (Host country + Purchasing country)

### SDG Alignment (ODD)

**Framework UN**:
- [SDG Goals](https://sdgs.un.org/goals)
- 17 Objectifs de Développement Durable
- 169 cibles spécifiques

**ATLAS ODD Mapping**:
- ODD 13: Climate Action (Primaire pour carbon projects)
- ODD 15: Life on Land (Foresterie, biodiversité)
- ODD 7: Affordable Clean Energy (Énergies renouvelables)
- ODD 2: Zero Hunger (Agriculture durable)

### ISO & Méthodologies Carbone

**Standards supportés**:
- ISO 14064 (GHG quantification)
- ISO 14065 (Verification bodies)
- CDM Methodologies (Clean Development Mechanism)
- Gold Standard
- Verra VCS (Verified Carbon Standard)

---

## 👥 Communauté & Support

### Canaux Officiels

**UNDP**:
- GitHub Issues: [undp/national-carbon-registry/issues](https://github.com/undp/national-carbon-registry/issues)
- Email: carbon-registry@undp.org (placeholder)

**ATLAS**:
- GitHub: [aguennoune/atlas-system](https://github.com/aguennoune/atlas-system)
- Email: aguennoune@biocontinuum-os

### Contributeurs

**UNDP Core Team**:
- Technical Lead: (UNDP)
- Architecture: (UNDP)
- Frontend Team: (UNDP)

**ATLAS Integration Team**:
- @aguennoune (Lead ATLAS Integration)
- BioContinuum OS Architect
- Quantum Eraser Protocol Designer

### Comment Contribuer

1. **Fork le repository**
   ```bash
   git clone https://github.com/undp/national-carbon-registry.git
   cd national-carbon-registry
   ```

2. **Créer une branche feature**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit avec conventional commits**
   ```bash
   git commit -m "feat(atlas): add NER scorer service"
   ```

4. **Push et créer Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

**Guidelines**:
- Suivre [Conventional Commits](https://www.conventionalcommits.org/)
- Tests unitaires requis (>80% coverage)
- Documentation mise à jour
- Code review par 2+ personnes

---

## 🔗 Projets Connexes

### Registres Carbone Similaires

- **CAD Trust**: [cadtrust.org](https://cadtrust.org) - Climate Action Data Trust
- **Verra Registry**: [verra.org](https://verra.org) - Verified Carbon Standard
- **Gold Standard**: [goldstandard.org](https://goldstandard.org)
- **Climate Warehouse**: [github.com/Chia-Network/climate-warehouse](https://github.com/Chia-Network/climate-warehouse)

### Blockchain Carbon Projects

- **Toucan Protocol**: [toucan.earth](https://toucan.earth) - Tokenized carbon credits (Polygon)
- **KlimaDAO**: [klimadao.finance](https://klimadao.finance) - Carbon backing for crypto
- **Regen Network**: [regen.network](https://regen.network) - Ecological data blockchain
- **Nori**: [nori.com](https://nori.com) - Carbon removal marketplace

### Knowledge Graph & Ontologies

- **DBpedia**: [dbpedia.org](https://dbpedia.org) - Structured Wikipedia data
- **Wikidata**: [wikidata.org](https://wikidata.org) - Free knowledge base
- **AGROVOC**: [agrovoc.fao.org](http://aims.fao.org/agrovoc) - Agriculture ontology (FAO)
- **Climate Tagger**: [climatetagger.net](https://www.climatetagger.net) - Climate change taxonomy

### ML Carbon Projects

- **WattTime**: [watttime.org](https://watttime.org) - Grid carbon intensity ML
- **Carbon Tracker**: [carbontracker.org](https://carbontracker.org) - Fossil fuel ML analysis
- **Climate TRACE**: [climatetrace.org](https://climatetrace.org) - Global emissions tracking

---

## 📊 Statistiques & Métriques

### UNDP Registry (Global)

- **Pays Déployés**: 4 (Sri Lanka, Ghana, Vanuatu, Côte d'Ivoire)
- **Projets Totaux**: 150+ (estimation)
- **Crédits Émis**: 1,000,000+ tCO2e
- **Organisations**: 100+

### ATLAS Integration (Phase 1)

- **Lines of Code**: ~2,500 (TypeScript)
- **Test Coverage**: 80%+ (Jest)
- **API Endpoints**: 3
- **Documentation Pages**: 5 (Markdown)
- **Migration Scripts**: 1 (TypeORM)

---

## 🎓 Ressources d'Apprentissage

### Tutoriels & Guides

- **UNDP Setup Guide**: [README.md](https://github.com/undp/national-carbon-registry/blob/main/README.md)
- **ATLAS Deployment**: [DEPLOYMENT_GUIDE.md](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/DEPLOYMENT_GUIDE.md)
- **NestJS Best Practices**: [nestjs.com/techniques](https://docs.nestjs.com/techniques)
- **TypeORM Migrations**: [typeorm.io/migrations](https://typeorm.io/migrations)

### Vidéos & Présentations

- **Article 6 Explained**: [UNFCCC YouTube](https://www.youtube.com/c/unfccc)
- **Carbon Markets 101**: [World Bank Carbon Pricing](https://www.worldbank.org/en/programs/pricing-carbon)

### Articles & Publications

- **Paris Agreement Article 6**: [unfccc.int](https://unfccc.int/process/the-paris-agreement/cooperative-implementation)
- **SDG Framework**: [sdgs.un.org](https://sdgs.un.org/goals)
- **IPCC Reports**: [ipcc.ch](https://www.ipcc.ch)

---

## 📝 Licence

**UNDP National Carbon Registry**: AGPL-3.0  
**ATLAS Framework**: AGPL-3.0

Les deux projets utilisent la licence AGPL-3.0, garantissant :
- ✅ Code open-source
- ✅ Modifications doivent être partagées
- ✅ Pas de vendor lock-in
- ✅ Transparence totale

---

## 🙏 Remerciements

- **UNDP Team** pour le registry open-source
- **BioContinuum OS** pour ATLAS Framework
- **Communauté open-source** carbone & blockchain
- **Contributors** Phase 1 ATLAS Integration

---

## 🔮 Roadmap Future

### 2026 Q1-Q2
- ✅ Phase 1: KG ODD Linker (Complété)
- 🔄 Phase 2: NER Scorer + NDC Router
- ⏳ Phase 3: ML Validation Engine

### 2026 Q3-Q4
- ⏳ Phase 4: Production Deployment
- ⏳ Dashboard UI ODD Visualization (D3.js)
- ⏳ Mobile App (React Native)

### 2027+
- ⏳ Expansion Afrique (10+ pays)
- ⏳ Blockchain Integration (Layer 2)
- ⏳ AI-powered Project Validation

---

**Maintenu par**: ATLAS Integration Team (@aguennoune)  
**Dernière mise à jour**: 2026-01-19  
**Version**: 1.0.0

---

⭐ **Star ce repository** si cette liste vous est utile !  
🤝 **Contributions bienvenues** - Ouvrez une PR pour ajouter des ressources !
