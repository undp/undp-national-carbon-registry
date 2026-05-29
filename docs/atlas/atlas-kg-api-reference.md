# ATLAS Knowledge Graph API Reference

## Vue d'ensemble

API externe pour le linkage automatique des projets carbone vers les Objectifs de Développement Durable (ODD/SDG).

**Base URL**: `http://cortex-kg:8080/api/v4`  
**Authentification**: Bearer Token (ATLAS_API_KEY)  
**Version**: 4.11.0-lts-quantique

## Endpoints

### POST /odd/link

Link un projet carbone aux ODD via analyse NLP et Knowledge Graph.

**Request**:
```json
{
  "text": "Plantation de 500 hectares d'arganiers pour séquestration carbone",
  "country": "MA",
  "sector": "Forestry",
  "context": "carbon_credit"
}
```

**Response**:
```json
{
  "odd_codes": [
    { "code": "ODD_13.1", "confidence": 0.92 },
    { "code": "ODD_13.2", "confidence": 0.85 },
    { "code": "ODD_15.1", "confidence": 0.78 },
    { "code": "ODD_2.4", "confidence": 0.65 }
  ],
  "global_confidence": 0.87,
  "graph_id": "atlas-kg-ma-2024"
}
```

### GET /health

Health check de l'API ATLAS KG.

**Response**:
```json
{
  "status": "ok",
  "version": "4.11.0-lts-quantique",
  "uptime_seconds": 3600
}
```

## Configuration

### Variables d'environnement

```bash
ATLAS_KG_URL=http://cortex-kg:8080/api/v4
ATLAS_API_KEY=your_api_key_here
ATLAS_KG_TIMEOUT_MS=5000
```

## ODD Codes Supportés

| Code | Description | Exemples Projets Maroc |
|------|-------------|------------------------|
| **ODD_13.1** | Résilience climatique | Agroforesterie, énergies renouvelables |
| **ODD_13.2** | Politiques climat | NDC Agriculture, NDC Foresterie |
| **ODD_15.1** | Écosystèmes terrestres | Restauration forêts, arganiers |
| **ODD_15.2** | Gestion durable forêts | Cèdres Atlas, oasis |
| **ODD_2.4** | Agriculture durable | Agroécologie, permaculture |
| **ODD_7.2** | Énergies renouvelables | Solaire, éolien |

## Mapping Secteur → ODD (Maroc)

Fallback utilisé si ATLAS KG indisponible :

| Secteur | ODD Primaires | ODD Secondaires |
|---------|---------------|-----------------|
| **Agriculture** | 2.4, 13.1 | 15.1 |
| **Forestry** | 13.1, 15.1, 15.2 | 2.4 |
| **Energy** | 7.2, 13.1 | 9.4 |
| **Transport** | 11.2, 13.1 | 9.1 |
| **Waste** | 12.5, 13.1 | 11.6 |

## Limites de Requêtes

- **Rate Limit**: 100 req/min
- **Timeout**: 5000ms par défaut
- **Payload Max**: 10KB

## SLA & Disponibilité

- **Uptime Target**: 99.5%
- **Temps Réponse Moyen**: < 150ms
- **Mode Fallback**: Automatique si timeout > 5s

## Exemples d'Utilisation

### Projet Agroforesterie Maroc

```bash
curl -X POST http://cortex-kg:8080/api/v4/odd/link \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Agroforesterie El Alaoui - 500 hectares arganiers séquestration carbone",
    "country": "MA",
    "sector": "Forestry",
    "context": "carbon_credit"
  }'
```

**Résultat Attendu**:
- Primary ODD: 13.1, 13.2, 15.1
- Secondary ODD: 2.4
- Confidence: 0.87

### Projet Énergie Solaire

```bash
curl -X POST http://cortex-kg:8080/api/v4/odd/link \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Parc solaire Noor Ouarzazate - Centrale thermique 580 MW",
    "country": "MA",
    "sector": "Energy",
    "context": "carbon_credit"
  }'
```

**Résultat Attendu**:
- Primary ODD: 7.2, 13.1
- Secondary ODD: 9.4
- Confidence: 0.91

## Architecture Knowledge Graph

```
┌─────────────────────────────────────────┐
│  ATLAS Knowledge Graph v4.11.0          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ODD Ontology (17 objectifs)       │  │
│  │ ├── ODD 13 (Climate Action)       │  │
│  │ │   ├── 13.1 (Resilience)         │  │
│  │ │   ├── 13.2 (Policies)           │  │
│  │ │   └── 13.3 (Education)          │  │
│  │ └── ODD 15 (Life on Land)         │  │
│  │     ├── 15.1 (Ecosystems)         │  │
│  │     └── 15.2 (Forests)            │  │
│  └───────────────────────────────────┘  │
│              ↓                          │
│  ┌───────────────────────────────────┐  │
│  │ NER Engine (Named Entities)       │  │
│  │ ├── Maroc: arganiers, cèdres      │  │
│  │ ├── Secteurs: foresterie, énergie │  │
│  │ └── Actions: séquestration, MWh   │  │
│  └───────────────────────────────────┘  │
│              ↓                          │
│  ┌───────────────────────────────────┐  │
│  │ Semantic Matching (ML)            │  │
│  │ ├── Word2Vec embeddings           │  │
│  │ ├── TF-IDF vectorization          │  │
│  │ └── Cosine similarity scoring     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Dépannage

### Erreur 401 Unauthorized

```bash
# Vérifier API Key
curl http://cortex-kg:8080/api/v4/health \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Erreur 504 Gateway Timeout

```bash
# Augmenter timeout dans .env
ATLAS_KG_TIMEOUT_MS=10000
```

### Mode Fallback Activé

Si `fallback_mode: true` dans réponse :
1. Vérifier connectivité ATLAS KG
2. Validation manuelle recommandée
3. Confiance basse (0.5) → review projet

## Support & Contact

- **Documentation ATLAS v4.11.0**: `atlas-system/BC-OS-Cortex/biolab-mcp-research-server/README.md` (workspace local)
- **GitHub Issues**: https://github.com/aguennoune/atlas-system/issues
- **Contact Technique**: aguennoune@biocontinuum-os

## Changelog

### v4.11.0-lts-quantique (2024-01-14)
- ✅ Ajout endpoint `/odd/link` pour projets carbone
- ✅ Support fallback mode (secteur-based mapping)
- ✅ Intégration ML Bridge (PyCaret Decision Tree)
- ✅ NER Maroc : arganiers, cèdres, oasis

---

**Note pour Maintainers UNDP** : Cette API est hébergée en externe (ATLAS stack). Pour déploiement interne UNDP, contacter l'équipe ATLAS pour setup on-premise.
