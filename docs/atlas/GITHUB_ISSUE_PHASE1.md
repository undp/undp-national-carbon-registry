# GitHub Issue: Phase 1 - Knowledge Graph ODD Linker

> **Note**: Les Issues sont désactivées sur le fork. Voici le contenu pour référence future ou pour soumettre au repository UNDP upstream.

---

**Title**: `[ATLAS Integration] Phase 1: Knowledge Graph ODD Linker - Proof of Concept`

**Labels**: `enhancement`, `phase-1`, `atlas-integration`, `documentation`

---

## 🎯 Objectif Phase 1

Implémenter le **@atlas-undp/kg-odd-linker** pour lier automatiquement les projets UNDP Carbon Registry aux Objectifs de Développement Durable (ODD/SDG) via le Knowledge Graph ATLAS v4.11.0.

**Durée**: 2 semaines  
**Type**: Proof of Concept (POC)  
**Branche**: `feature/atlas-integration`

---

## 📦 Livrables

### ✅ Complétés

- [x] **@atlas-undp/kg Library** (`libs/atlas-kg/`)
  - Service NestJS complet pour linkage ODD
  - Controller REST API avec 3 endpoints
  - Tests unitaires Jest (80%+ coverage)
  - Mode fallback intégré

- [x] **Documentation Technique**
  - ADR-001: Architecture Decision Record
  - DEPLOYMENT_GUIDE: Guide de déploiement étape par étape
  - atlas-kg-api-reference.md: Spécifications API ATLAS KG
  - atlas-kg-api-spec.yaml: OpenAPI 3.0 spec
  - AWESOME_UNDP_ATLAS.md: Liste curée complète de ressources

- [x] **Extensions Backend UNDP**
  - Migration TypeORM pour colonnes JSONB (`odd_links`, `kg_relations`)
  - Index GIN PostgreSQL pour recherche rapide
  - Intégration ProjectService (code examples)

### 🔄 En Cours

- [ ] **Tests d'Intégration**
  - Installation locale dependencies
  - Configuration variables d'environnement
  - Exécution migration PostgreSQL
  - Tests endpoints API

- [ ] **Validation Données**
  - Test linkage 50 projets Maroc (agroforesterie)
  - Vérification précision ODD (target: >85%)
  - Mesure temps réponse (target: <200ms)

---

## 🚀 API Endpoints Disponibles

```bash
POST /api/atlas/kg/link-project/:id      # Link projet → ODD via KG
GET  /api/atlas/kg/validate-odds/:id     # Validation ODD linkage
GET  /api/atlas/kg/health                # Health check ATLAS KG
```

---

## 📊 Success Metrics

| Métrique | Target Phase 1 | Status | Mesure |
|----------|----------------|--------|--------|
| **Couverture ODD** | 100% projets | 🟡 À valider | COUNT(odd_links IS NOT NULL) / COUNT(*) |
| **Temps réponse** | < 200ms | 🟡 À tester | AVG(link_duration_ms) |
| **Précision linkage** | > 85% | 🟡 À valider | Validation manuelle 50 projets |
| **Tests unitaires** | > 80% coverage | ✅ Codés | Jest coverage report |
| **Disponibilité ATLAS KG** | > 99% | 🟡 À monitorer | Uptime service |

---

## 🧪 Plan de Test

### Test 1: Projet Agroforesterie Maroc

**Input**:
```json
{
  "title": "Agroforesterie El Alaoui - Arganiers",
  "description": "Plantation de 500 hectares d'arganiers dans la région de Souss-Massa pour séquestration carbone et restauration écosystèmes",
  "country": "MA",
  "sector": "Forestry"
}
```

**Output Attendu**:
- Primary ODD: 13.1, 13.2, 15.1
- Secondary ODD: 2.4
- Confidence: > 0.80
- Fallback mode: false

### Test 2: Projet Énergie Solaire

**Input**:
```json
{
  "title": "Parc solaire Noor Ouarzazate",
  "description": "Centrale solaire thermique 580 MW",
  "country": "MA",
  "sector": "Energy"
}
```

**Output Attendu**:
- Primary ODD: 7.2, 13.1
- Secondary ODD: 9.4
- Confidence: > 0.85

### Test 3: Mode Fallback

**Scénario**: ATLAS KG indisponible (simuler timeout)

**Output Attendu**:
- Primary ODD: 13.1 (default climat)
- Confidence: 0.5
- Fallback mode: true
- Warning logged: "ATLAS KG unavailable"

---

## 🛠️ Installation & Configuration

### 1. Variables d'environnement

```bash
# Créer .env à la racine UNDP
ATLAS_KG_URL=http://cortex-kg:8080/api/v4
ATLAS_API_KEY=your_atlas_api_key_here
ENABLE_ATLAS_ODD_LINKAGE=true
```

### 2. Installation dépendances

```bash
cd libs/atlas-kg
npm install
npm run build
```

### 3. Migration DB

```bash
# Copier migration vers backend
cp libs/atlas-kg/migrations/1705228800000-AddAtlasOddLinkage.ts \
   backend/services/src/migrations/

# Exécuter migration
npm run migration:run
```

### 4. Démarrage serveur

```bash
npm run start:dev

# Vérifier health
curl http://localhost:3000/api/atlas/kg/health
```

---

## 📚 Documentation

- **Awesome List**: [docs/atlas/AWESOME_UNDP_ATLAS.md](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/AWESOME_UNDP_ATLAS.md)
- **ADR-001**: [docs/atlas/ADR-001-KG-Integration.md](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/ADR-001-KG-Integration.md)
- **Deployment Guide**: [docs/atlas/DEPLOYMENT_GUIDE.md](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/DEPLOYMENT_GUIDE.md)
- **API Reference**: [docs/atlas/atlas-kg-api-reference.md](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/docs/atlas/atlas-kg-api-reference.md)
- **OpenAPI Spec**: [specs/atlas/atlas-kg-api-spec.yaml](https://github.com/aguennoune/undp-national-carbon-registry/blob/feature/atlas-integration/specs/atlas/atlas-kg-api-spec.yaml)

---

## 🚧 Risques & Mitigation

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| ATLAS KG indisponible | High | Low | ✅ Mode fallback implémenté |
| Latence > 200ms | Medium | Medium | Cache Redis (Phase 2) |
| Précision < 85% | High | Low | Validation manuelle + NER Scorer (Phase 2) |
| Migration DB échoue | High | Low | Rollback script disponible |

---

## 🔄 Prochaines Étapes

### Phase 1 (Cette Issue)
1. ✅ Code @atlas-undp/kg
2. ✅ Documentation complète
3. 🔄 Tests d'intégration locaux
4. ⏳ Validation 50 projets Maroc
5. ⏳ Pull Request vers UNDP upstream

### Phase 2 (Semaines 3-10)
- NER Scorer (entités Maroc: arganiers, cèdres, oasis)
- NDC Router (3 NDCs Maroc: Agriculture, Foresterie, Migration)
- Cache Redis pour mappings fréquents

### Phase 3 (Semaines 11-18)
- ML Bridge (atlas_sovereignty_dt_v4.pkl)
- Quantum Eraser protocol pour validation souveraine
- Dashboard UI avec visualisation graphe ODD (D3.js)

---

## 👥 Contributeurs

- **ATLAS Integration Team**: @aguennoune
- **UNDP Technical Lead**: (À assigner)
- **BioContinuum OS Architect**: (Review)

---

## 📎 Liens Utiles

- **ATLAS v4.11.0 Source**: https://github.com/aguennoune/atlas-system
- **UNDP Registry v2.0rc1**: https://github.com/undp/national-carbon-registry
- **ODD Framework**: https://sdgs.un.org/goals
- **Article 6 Paris Agreement**: https://unfccc.int/process/the-paris-agreement/cooperative-implementation

---

**Licence**: AGPL-3.0 (Compatible UNDP Carbon Registry)

---

## 📝 Instructions pour Soumettre

1. **Fork UNDP upstream** activé avec Issues
2. **Copier ce contenu** dans nouvelle issue
3. **Assigner labels**: `enhancement`, `phase-1`, `atlas-integration`
4. **Mentionner**: UNDP Technical Lead + reviewers
5. **Lier PR**: #XXX (Pull Request feature/atlas-integration)
