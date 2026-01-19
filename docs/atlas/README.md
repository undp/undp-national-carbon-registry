# ATLAS v4.11.0-lts-quantique × UNDP Carbon Registry Integration

[![Awesome UNDP × ATLAS](https://awesome.re/badge.svg)](AWESOME_UNDP_ATLAS.md)

> 📚 **[Awesome UNDP × ATLAS](AWESOME_UNDP_ATLAS.md)** - Liste curée complète de ressources, outils et intégrations

## 🎯 Vision Stratégique

Intégration du système ATLAS (Autonomous Trust Layer Architecture System) avec le UNDP National Carbon Credit Registry pour la validation souveraine des projets carbone via :
- **Knowledge Graph (KG)** : Linkage ODD 13/15 + Article 6 Paris Agreement
- **NER Scoring** : Formule Carbon_NER pour classement Tier 1/2/3
- **NDC Routing** : 3 NDCs Maroc (Agriculture, Foresterie, Migration Climatique)
- **ML Bridge** : PyCaret Decision Tree (atlas_sovereignty_dt_v4.pkl) pour validation

## 📦 Structure Nx Workspace

```
libs/
├── atlas-kg/          # Knowledge Graph ODD Linker
├── atlas-ner/         # Named Entity Recognition Scorer
├── atlas-ndc/         # NDC Router (Maroc NDCs 2021)
└── atlas-nlp/         # NLP Context Analyzer

docs/atlas/            # Documentation ATLAS
specs/atlas/           # Spécifications techniques
```

## 🚀 Phase 1: Proof of Concept (2 semaines)

### Objectif
Démontrer la faisabilité technique du linkage ODD via Knowledge Graph ATLAS.

### Livrables
1. **@atlas-undp/kg-odd-linker** (libs/atlas-kg/)
   - Service TypeScript pour ProjectEntity → KG ATLAS
   - Mapping ODD 13.1, 13.2, 15.1, 15.2 (Maroc)
   - API RESTful `/api/atlas/kg/link-project/:projectId`

2. **Backend Extension** (backend/services/libs/shared/src/entities/)
   - Extend `projects.entity.ts` avec champs ATLAS :
     ```typescript
     @Column({ type: 'jsonb', nullable: true })
     odd_links?: {
       primary: string[];    // ['ODD_13.1', 'ODD_13.2']
       secondary: string[];  // ['ODD_15.1']
     };
     
     @Column({ type: 'jsonb', nullable: true })
     kg_relations?: {
       graph_id: string;
       confidence: number;
       last_update: Date;
     };
     ```

3. **Documentation** (docs/atlas/)
   - Architecture Decision Record (ADR-001-KG-Integration.md)
   - API Specification (atlas-kg-api-spec.yaml)

### Success Metrics Phase 1
- ✅ 100% des projets UNDP mappés vers ODD via KG
- ✅ Temps de réponse < 200ms pour linkage
- ✅ Tests d'intégration passants (Jest + Supertest)

## 📋 Roadmap Complète

| Phase | Durée | Objectif | Livrables Clés |
|-------|-------|----------|----------------|
| **Phase 0** | 1 semaine | Analyse technique UNDP v2.0rc1 | ✅ Rapport 9,000 mots<br>✅ Plan ATLAS-UNDP 15,000 mots |
| **Phase 1** | 2 semaines | Proof of Concept KG | @atlas-undp/kg-odd-linker<br>Backend extensions<br>Tests unitaires |
| **Phase 2** | 8 semaines | NER + NDC Integration | @atlas-undp/ner-scorer<br>@atlas-undp/ndc-router<br>ML Bridge API |
| **Phase 3** | 8 semaines | ML Validation Engine | atlas_sovereignty_dt_v4.pkl adapter<br>Quantum Eraser protocol<br>Dashboard UI |
| **Phase 4** | 3 semaines | Production + Monitoring | CI/CD pipelines<br>Grafana dashboards<br>Documentation finale |

## 🎓 Climate Migration Reintegration (Phase 1.6)

### Contexte Philosophique
*"L'important ce n'est pas ce qu'on fait de nous, mais ce que nous faisons nous-mêmes de ce qu'on a fait de nous."* — Jean-Paul Sartre

Application : Transformation de la dette entropique (40 ans d'intégration) en capital souverain (10 ans via projets carbone).

### KPIs Spécifiques
1. **KPI 13.3** : Familles migrantes climatiques formées (Target: 5,000 d'ici 2030)
2. **KPI 15.4** : Projets agroforestiers familiaux certifiés (Target: 2,500 hectares)

### NDC Social (Maroc)
**NDC-Social-Migration** : Réintégration de 5,000 familles migrantes via projets carbone ruraux.
- Baseline: 0 familles (2024)
- Target: 5,000 familles (2030)
- Méthode: Co-apprentissage intergénérationnel (enfants → parents → projets)

## 🛠️ Quick Start

```bash
# Installer dépendances ATLAS
cd libs/atlas-kg
npm install @nestjs/common @nestjs/axios axios

# Run tests
npm run test:atlas

# Lancer serveur dev avec ATLAS
cd ../../
npm run start:dev

# Endpoint test KG
curl http://localhost:3000/api/atlas/kg/link-project/PROJECT_ID_123
```

## 📜 Licence
AGPL-3.0 (Compatible avec UNDP National Carbon Registry)

## 📚 Références
- UNDP Carbon Registry v2.0rc1: https://github.com/undp/national-carbon-registry
- ATLAS v4.11.0 Documentation: `/BC-OS-Cortex/biolab-mcp-research-server/README.md`
- Plan d'Intégration Détaillé: `/nx-nano-datacenter/packages/ATLAS-UNDP-Integration-Plan.md`
- Climate Migration Chapter: Section Phase 1.6

---

**Dernière mise à jour** : $(date +%Y-%m-%d)  
**Auteur** : ATLAS Integration Team  
**Contact** : aguennoune@biocontinuum-os
