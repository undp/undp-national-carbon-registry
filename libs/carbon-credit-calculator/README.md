# Carbon Registry - Credit Calculation 

## Introduction
The library includes the implementations carbon credits calculation for different sectors. Currently implemented only two of the sectors which are Agriculture and Energy. 

## Sectors
According to the UNFCCC - CDM (Clean Development Mechanism) methodologies, identified sectors are as follows,

1. Energy industries (renewable / non-renewable sources) 
2. Energy distribution 
3. Energy demand 
4. Manufacturing industries 
5. Chemical industries 
6. Construction 
7. Transport 
8. Mining/mineral production 
9. Metal production 
10. Fugitive emissions from fuels (solid, oil and gas) 
11. Fugitive emissions from production and consumption of halocarbons and sulphur hexafluoride 
12. Solvent use 
13. Waste handling and disposal 
14. Afforestation and reforestation 
15. Agriculture 

## Calculation - Sector Agriculture 
```
Number of Credits = #hectares * #days * #tCO2e/ha/day 
```

| **Input Field** | **Data Type** | **Mandatory/Optional** | **Default Value** | **Possible values if any** | **Validations** |
| --- | --- | --- | --- | --- | --- |
| landArea | Float | Mandatory | | |  Area\>0Format – Non-zero, Can't be negative <br>Invalid area Format – Not a number <br>Empty area Format - Empty field |
| landAreaUnit | String | Mandatory | | ha | Invalid unit Format – Invalid field <br>Empty unit Format – Empty field |
| duration | Integer | Mandatory | | | Days \> 0 Format – Non-zero, Can't be negative <br>Invalid input field Format – Not a number <br>Format – Empty field |
| durationUnit | String | Mandatory | | Days | Invalid unit Format – Invalid field <br>Empty unit Format – Empty field |

### System Configurations

#### Constants

| **Constant Name** | **Value** | **Unit**           | **Unit of Measurement** |
| ----------------- | --------- | ------------------ | ----------------------- |
| emissionFactor    | 0.046     | emissionFactorUnit | tCO2e/ha/day            |

Constant values can parse externally. If not use above default constants.

Example Calculation: 
``` 
Hectares - 16ha 
Days – 120 
Constant – 0.046 
```
```
 #hectares * #days * #tCO2e/ha/day = 16*120*0.046 = 88.32 
```

## Calculation - Sector Energy

### Sub Sector: Solar

Approved Methodology: Solar Photovoltaic (PV) 

```
Parameters: 
 
X – Enegy generation value (kWh/year/unit) 
Y – Threshold value (kWh/year/unit) 
A – High emission factor (tCO2/ MWh) 
B – Low emission factor (tCO2/ MWh) 
```
```
If X < Y ; X*A 
If X >= Y ; Y*A + (X-Y)*B 
```

| **Input Field** | **Data Type** | **Mandatory/ Optional** | **Default Value** | **Possible values if any** | **Validations** |
| --- | --- | --- | --- | --- | --- |
| energyGeneration | Float | Mandatory | || Energy \> 0 Format – Non-zero, Can't be negative<br>Invalid input field Format – Not a number<br>Format - Empty input field|
| energyGenerationUnit | String | Mandatory | | kWh/year | Invalid unit Format – Invalid field<br>Empty unit Format – Empty field |
| buildingType | String | Mandatory | | Household<br>Health Center<br>Dispensary<br>School<br>Primary School<br>Secondary School<br>Public Administration<br>Trading Place<br>Bus Stop| Invalid input field Format – Invalid field<br>Empty input fieldFormat – Empty field |

### System Configurations 

#### Constants
| **Constant Name** | **Value** | **Unit of Measurement** |
| --- | --- | --- |
| High Emission Factor (A) | 6.8(at or below threshold) | High emission factor (tCO2/ MWh) |
| Low Emission Factor (B) | 1.3(above throshold) | Low emission factor (tCO2/ MWh) |
| Building Type || Household, Health Center, Dispensary, School, Primary School, Secondary School, Public Administration, Trading Place, Bus Stop|

#### Threshold

| **Building Type** | **Threshold Value** | **Unit of Measurement** |
| --- | --- | --- |
| Household | 55 | kWh/y |
| Health Center | 825 | kWh/y |
| Dispensary | 825 | kWh/y |
| School | 275 | kWh/y |
| Primary School | 275 | kWh/y |
| Secondary School | 275 | kWh/y |
| Public Administration | 55 | kWh/y |
| Trading Place | 825 | kWh/y |
| Bus Stop | 200 | kWh/y |

Example Calculation:

1. A - High emission factor (tCO2/ MWh) = 6.8
2. B - Low emission factor (tCO2/ MWh) = 1.3
3. Bulding Type – Household 
    - Y Threshold value (kWh/year/unit) = 55
<br><br>
4. X - Measured value (kWh/year/unit) = 20
      ```
      X < Y ; X*A = (20/1000)*6.8 = 0.136
      ```
5. X - Measured value (kWh/year/unit) = 105
      ```
      X >= Y ; Y*A + (X-Y)*B = (55/1000)*6.8 + {(105-55)/1000}*1.3 = 0.439
      ```


## Usage
<!-- ### Install
```
npm i --save @undp/carbon-credit-calculator
``` -->

### Generate Credit based on the Sector
```
import { AgricultureConstants, AgricultureCreationRequest, calculateCredit, SolarConstants, SolarCreationRequest } from '@undp/carbon-credit-calculator';

// Create creditCreationRequest based on the sector
// AgricultureCreationRequest if it is Agriculture sector
// SolarCreationRequest if it is a Solar sub sector.
let creditCreationRequest: CreditCreationRequest = <Sub sector specific create req>;
const credit = await calculateCredit()
```
