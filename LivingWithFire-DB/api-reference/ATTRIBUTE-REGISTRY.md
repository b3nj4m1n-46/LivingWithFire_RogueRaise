# Production Attribute Registry

Complete attribute hierarchy for the Living With Fire production database.
Each attribute has a UUID, value type, allowed values, and position in the tree.

**Use this document to:** map source dataset columns to production attributes,
validate values before import, understand the EAV schema.

**Total root categories:** 13

---

## Climate
- **UUID:** `0f9a1e6e-ff83-4d7f-988c-5f7c72ae308b`
- **Type:** text (multi)

  ### Climate List Choice
  - **UUID:** `2cd5ffd7-10f1-431d-945e-064bcfd2c195`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

  ### Climate Vulnerable
  - **UUID:** `e4fc1511-f6ea-46c7-b2c6-b7869d5dc7e9`
  - **Type:** boolean (single)

## Edibility
- **UUID:** `52c06414-5607-4846-beb5-e4f7cfe6c7f2`
- **Type:** text (multi)

  ### Edible Plant
  - **UUID:** `4afa9fb3-dd3c-4f46-bd99-5b584dc10605`
  - **Type:** boolean (single)

  ### Edible Plant List Choice
  - **UUID:** `cba229ad-e004-4ece-ac5b-f2bb3ac0c6a5`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

## Environmental Requirements to Thrive
- **UUID:** `362695a6-8fe1-44ac-8730-f1921e28025e`
- **Type:** text (multi)

  ### Enviro List Choice
  - **UUID:** `d13b7437-6f18-4da9-8c3b-8d5c377000db`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

  ### Hardiness Zone
  - **UUID:** `f0b45dc9-ee00-479a-8181-b4fda01f5233`
  - **Type:** text (multi)
  - **Notes:** Hardiness Zones 4-9
  - **Allowed Values:** `01`, `02`, `03`, `04`, `05`, `06`

  ### Light Needs
  - **UUID:** `7096a9cc-3435-4e14-a1c4-eb9e95f0850f`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

## Flammability
- **UUID:** `a8b73bcb-a997-4778-8415-13493a61b40d`
- **Type:** text (multi)

  ### Character Score
  - **UUID:** `70dcbd81-352d-4678-8d8a-f3bd51f1bab6`
  - **Type:** numeric (single)
  - **Notes:** 1-2 = plant 0 (P0)
3-4 = plant 5-10 (P5)
5-8 = plant 10+ (P10)
9-12 = plant 10-30 sparsely (P10S)
13-16 = plant 30+ (P30)
17+ = plant 50+ (P50)
20+ = plant 100+ or (P100)
NW = don't plant anywhere!
NA = not applicable

    #### <2 ft tall
    - **UUID:** `505b81d5-3365-45c4-aba3-d54c2bfbe040`
    - **Type:** boolean (single)

    #### All plants
    - **UUID:** `d83ac908-eaf7-4503-98ef-2b9a607215a6`
    - **Type:** text (multi)

      ##### 18
      - **UUID:** `44eb0587-a50b-4912-a68a-07bb56458f3f`
      - **Type:** text (multi)
      - **Notes:** Retains dead twigs, leaves, pods, petioles, etc. > 2 1, 2, or 3
      - **Allowed Values:** `01`, `02`, `03`

      ##### 20
      - **UUID:** `c6e248cc-e70d-4ba3-bbb6-73cc27c333ea`
      - **Type:** text (multi)
      - **Notes:** Leaves have waxy coating 1
      - **Allowed Values:** `01`

      ##### 22A
      - **UUID:** `f1b6ab0e-d627-4dea-829d-c8d9fb64c54c`
      - **Type:** text (multi)
      - **Notes:** Not adapted to the local climate or requires a lot of water to remain alive
      - **Allowed Values:** `01`, `02`

      ##### 22B
      - **UUID:** `fa0f9e5a-9dbd-4651-b8f6-a0f415dd0b77`
      - **Type:** text (multi)
      - **Notes:** Seriously susceptible to disease, pests, or drought 1 or 2
      - **Allowed Values:** `01`, `02`

      ##### 22C
      - **UUID:** `e18737dd-fc4c-4fcf-996f-64eb2d70faa2`
      - **Type:** text (multi)
      - **Notes:** Has invasive qualities or can harm natural ecosystems, infrastructure, or humans 1, 2, or 3
      - **Allowed Values:** `01`, `02`, `03`

      ##### 22D
      - **UUID:** `3efab83c-62fe-45d8-82c2-133f6e6ef6f3`
      - **Type:** text (multi)
      - **Notes:** Considered a noxious weed in Oregon or on federal invasive species lists 3, 4, or 5
      - **Allowed Values:** `01`, `02`, `03`

      ##### 3
      - **UUID:** `584a3a55-2204-4b33-a014-7f54ec2cff45`
      - **Type:** text (multi)
      - **Notes:** Resin/volatiles present 1, 2, 3, or 4
      - **Allowed Values:** `01`, `02`, `03`, `04`

    #### Broadleaf or deciduous shrub
    - **UUID:** `ff6580ef-36c4-4de6-9889-ef804256f67b`
    - **Type:** boolean (single)

    #### Conifer or evergreen tree
    - **UUID:** `6a5af453-8153-45a3-9c44-96026380bf60`
    - **Type:** boolean (single)

    #### Deciduous trees
    - **UUID:** `3e52ddf8-f4f2-4c32-8042-69c5cbdb82ae`
    - **Type:** boolean (single)

    #### Evergreen shrub
    - **UUID:** `e32c3e99-769e-415a-92c2-f1a55de653af`
    - **Type:** boolean (single)

    #### G, GE, A, B, or PE, PD
    - **UUID:** `786168ee-7117-40eb-96c2-e6ef296db480`
    - **Type:** text (multi)

      ##### 11A
      - **UUID:** `ea58e4fe-f309-4c06-a419-bfa560f207d3`
      - **Type:** text (multi)
      - **Notes:** Evergreen or has thin or fine leaves 1 or 2
      - **Allowed Values:** `01`, `02`

      ##### 11B
      - **UUID:** `804db857-72bd-4667-a074-74fa373d2b9c`
      - **Type:** text (multi)
      - **Notes:** Growth: dense 2 moderate 1 spreading 1, 2, or 3
      - **Allowed Values:** `01`, `02`, `03`

    #### Graminoid
    - **UUID:** `ccadc23a-540a-4e98-98e3-e7b6a24b9d4b`
    - **Type:** text (multi)

      ##### 16
      - **UUID:** `9dcadec7-78dd-46ee-b079-2faed89dee0b`
      - **Type:** text (multi)
      - **Notes:** Grass is > 2' tall, retains dead matter, or turns yellow or brown 4, 5, or 6
      - **Allowed Values:** `01`, `02`, `03`

    #### Tree
    - **UUID:** `3df9f7a5-d059-43e6-80be-8da66f939658`
    - **Type:** text (multi)

      ##### 5
      - **UUID:** `35a44caa-9c26-4d26-8c7d-0fe6924ff0e4`
      - **Type:** text (multi)
      - **Notes:** Sheds a lot of needles, leaves, branches, bark, flowers, seed pods, or other matter 1, 2, or 3
      - **Allowed Values:** `01`, `02`, `03`

    #### Trees & Shrubs
    - **UUID:** `e2ff3033-87bb-4a90-8d61-d3ab26b465e8`
    - **Type:** text (multi)

      ##### 11
      - **UUID:** `053ec6c0-1330-4608-933b-061d16d58315`
      - **Type:** text (multi)
      - **Notes:** Has thin or fine leaves 1 or 2 Growth form density: dense 2 moderate 1
      - **Allowed Values:** `01`, `02`

      ##### 13
      - **UUID:** `31de65e9-c9e1-465b-afe6-93b3e28224e4`
      - **Type:** text (multi)
      - **Notes:** Evergreen or has thin or fine leaves 1 or 2 Growth: dense 2 moderate 1 spreading 1, 2, or 3
      - **Allowed Values:** `01`, `02`, `03`

      ##### 7
      - **UUID:** `0e4faff5-7cff-4eb9-aac1-e23f2a9bf9ec`
      - **Type:** text (multi)
      - **Notes:** Multiple stems or branches < 4' above ground 1, 2, or 3
      - **Allowed Values:** `01`, `02`, `03`

      ##### 9
      - **UUID:** `f2b3dbce-3d74-449e-9c9f-d246198e015a`
      - **Type:** text (multi)
      - **Notes:** Trunk/stem has papery or shreddy bark, or thorns 1
      - **Allowed Values:** `01`

    #### Vine
    - **UUID:** `5160e10a-ef16-4d07-9a5a-87d3d89306da`
    - **Type:** text (multi)

      ##### 15
      - **UUID:** `c4214397-b8d9-4a05-9407-9c7bd7cc2e24`
      - **Type:** text (multi)
      - **Notes:** Arrows 1, 2, 3, or 4
      - **Allowed Values:** `01`, `02`, `03`

    #### Zone 0-5 plants
    - **UUID:** `5f11cb61-48a2-4206-8c05-16d8a041d148`
    - **Type:** boolean (single)

  ### Flammability Notes
  - **UUID:** `34b147da-613b-4df7-8eb9-76fd10e1d7ae`
  - **Type:** text (multi)

  ### Home Ignition Zone (HIZ)
  - **UUID:** `b908b170-70c9-454d-a2ed-d86f98cb3de1`
  - **Type:** text (multi)
  - **Units:** ft
  - **Allowed Values:** `01`, `02`, `03`, `04`, `05`

  ### Idaho Database--minimum planting distance in feet on flat terrain
  - **UUID:** `32db8c6c-f842-421d-90e6-e0fd231fc39e`
  - **Type:** text (multi)
  - **Units:** ft
  - **Notes:** Zone 1 is 0-30 ft; fire resistant plants only
Zone 2 is 30-60 ft; reduce plant density
Zone 3 is 60-100 ft; thin & prune existing plants.
  - **Allowed Values:** `01`, `02`, `03`, `04`, `05`, `06`, `07`, `08`, `09`, `10`

  ### Idaho Zone Tier (Calculated)
  - **UUID:** `f47ac10b-58cc-4372-a567-0e02b2c3d479`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated from Idaho Database minimum planting distance. Maps Idaho scores to zones.
  - **Allowed Values:** `1`, `2`, `3`

  ### List Choice
  - **UUID:** `d996587c-383b-4dc6-a23c-239b7de7e47b`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`, `04`

  ### Restrictions
  - **UUID:** `374a88b1-c8e1-45fd-bb76-b9d5efbfb315`
  - **Type:** text (multi)

    #### Ashland
    - **UUID:** `1ddbe951-69ef-4b4b-aa20-75b97cb0207c`
    - **Type:** text (multi)
    - **Notes:** NW=Oregon State listed "noxious weed"
Weed=invasive in several states, or nationally/globally listed
P10=prohibit within 10 ft of buildings
P30=prohibit within 30 ft of buildings
P50=prohibit within 50 ft of buildings
P100=prohibit within 100 ft of buildings
PH=prohibit because it is harmful to humans, the environment or infrastructure
    - **Allowed Values:** `01`, `02`, `03`, `04`, `05`, `06`, `07`

  ### Risk Reduction Notes - Best Practices
  - **UUID:** `2cba404d-a80a-4cfd-abd9-c475237a06ec`
  - **Type:** text (multi)

## Growth
- **UUID:** `cc64cf77-ebae-4d70-b500-167fe0577eef`
- **Type:** text (multi)

  ### Bloom & Flower
  - **UUID:** `0d93c859-ee40-4c18-8824-02d9cd630316`
  - **Type:** text (multi)

    #### Bloom Time
    - **UUID:** `ca684872-8841-420e-a85b-b6d247b5b96e`
    - **Type:** text (multi)
    - **Allowed Values:** `01`, `02`, `03`, `04`

    #### Flower Color
    - **UUID:** `86a95833-886a-42bf-b149-c3754e9d913a`
    - **Type:** text (multi)
    - **Allowed Values:** `01`, `02`, `03`, `04`, `05`, `06`

    #### Flower Smell
    - **UUID:** `de8e2a8a-0a69-484b-a3e3-097b68403b17`
    - **Type:** text (multi)
    - **Allowed Values:** `01`, `02`, `03`

  ### Growth List Choice
  - **UUID:** `18efd95f-eeb5-418d-be0e-3f855943d200`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

  ### Plant Size
  - **UUID:** `48625aa4-12ab-47fb-b01b-623f7140e88f`
  - **Type:** text (multi)

    #### Plant Height
    - **UUID:** `c0f9bad4-f164-4e72-ac47-a1abcfc57d33`
    - **Type:** text (multi)

      ##### Max Mature Height
      - **UUID:** `7692e4d8-9e4d-42b2-bdf3-5b386feeecfb`
      - **Type:** numeric (single)
      - **Units:** ft

      ##### Min Mature Height
      - **UUID:** `5d642c32-436d-4075-bbb9-39794bae07d1`
      - **Type:** numeric (single)
      - **Units:** ft

    #### Plant Width
    - **UUID:** `df410a6a-8827-4908-9083-70e93f4f79bd`
    - **Type:** text (multi)

      ##### Max Mature Width
      - **UUID:** `75fdd111-5a66-4319-94b0-1461f7114834`
      - **Type:** numeric (single)
      - **Units:** ft

      ##### Min Mature Width
      - **UUID:** `8643e98d-2970-439f-b93e-b4d3239e289e`
      - **Type:** numeric (single)
      - **Units:** ft

  ### Plant Structure
  - **UUID:** `b2150aec-75ac-4b4b-aeb1-c339c5da563c`
  - **Type:** text (multi)

    #### Annual herb
    - **UUID:** `937ecd33-9dad-4cfb-b49c-33b28bdf3037`
    - **Type:** boolean (single)

    #### Bark
    - **UUID:** `7a34c095-d01d-494e-8b30-55a8cd386790`
    - **Type:** text (multi)
    - **Allowed Values:** `01`, `02`, `03`, `04`

    #### Biennial
    - **UUID:** `6056539b-988c-401d-b3ae-25e165afb707`
    - **Type:** boolean (single)

    #### Chemical content
    - **UUID:** `9caeaf11-007f-425d-8200-84d4116b8b53`
    - **Type:** text (multi)
    - **Allowed Values:** `01`, `02`, `03`, `04`

    #### Deciduous
    - **UUID:** `fee87734-db6e-4c92-926f-bb606f529b6d`
    - **Type:** boolean (single)

    #### Evergreen
    - **UUID:** `f2ed9581-6d15-47ff-93c0-4259bccce5e1`
    - **Type:** boolean (single)

    #### Graminoid
    - **UUID:** `f1108fb9-e629-4be3-99c1-bdae47ce0cf7`
    - **Type:** boolean (single)

    #### Groundcover
    - **UUID:** `82f68242-238f-4567-bb47-90da80b5c338`
    - **Type:** boolean (single)

    #### Habit/Form
    - **UUID:** `ce4ce677-b02f-4d7d-b7f3-10052b65c03a`
    - **Type:** text (multi)
    - **Notes:** Researchers disagree on whether plant density reduces or increases its flammability. A dense plant has a higher amount of fuel, but an open plant is better aerated. The key is the condition of the leaves and amount of dead matter in the plant.
    - **Allowed Values:** `01`, `02`, `03`, `04`, `05`, `06`, `07`, `08`, `09`, `10`, `11`, `12`

    #### Leaf Structure
    - **UUID:** `eebb5a89-20be-4338-adfb-91c829201909`
    - **Type:** text (multi)
    - **Allowed Values:** `01`, `02`, `03`, `04`, `05`, `06`, `07`, `08`, `09`, `10`

    #### Perennial or Fern
    - **UUID:** `ee35a2f2-7c12-47ea-8486-bdb34118d639`
    - **Type:** boolean (single)

    #### Semi-evergreen
    - **UUID:** `eeb535dd-082e-45f9-8799-455903d0362e`
    - **Type:** boolean (single)

    #### Shrub
    - **UUID:** `ef9be401-1500-471b-bf8f-b11936d6d047`
    - **Type:** boolean (single)

    #### Succulent
    - **UUID:** `7632a8a3-a9b8-4e35-8e8c-e3f9ccca9c0e`
    - **Type:** boolean (single)

    #### Tree
    - **UUID:** `d5673c20-6fb7-49e3-b7e3-d056caf8d205`
    - **Type:** boolean (single)

    #### Vine
    - **UUID:** `eb566f0c-de5c-4981-9060-8ece5ab85997`
    - **Type:** boolean (single)

## Invasiveness
- **UUID:** `eb253827-28ef-4fe5-94ba-a299e51bf40b`
- **Type:** text (multi)

  ### Invasive
  - **UUID:** `284b2037-fef8-4b88-abd4-5387a4901109`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`

  ### Invasive (Calculated)
  - **UUID:** `bacadba3-a4f8-4550-9906-6b5535a619b6`
  - **Type:** text (multi)
  - **Calculated:** Yes
  - **Notes:** Calculated from Invasive Qualities.

  ### Invasive Qualities
  - **UUID:** `a0900c7f-3bb3-4757-9dec-075f718c8f3e`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

## Nativeness
- **UUID:** `5d0586f8-c13c-4b52-9507-0f4a4f1f97f8`
- **Type:** text (multi)

  ### Native Status
  - **UUID:** `716f3d8f-195f-4d16-824b-6dd1e88767a6`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`, `04`, `05`

  ### Oregon Native
  - **UUID:** `d5fb9f61-41dd-4e4e-bc5e-47eb24ecab46`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

## Plant Materials
- **UUID:** `c44f3131-fcd6-4fda-bac2-31c7b9a42943`
- **Type:** text (multi)

  ### Availability
  - **UUID:** `94a1c46e-8d0c-4a8b-b951-09ee6b04a43e`
  - **Type:** text (single)
  - **Allowed Values:** `01`, `02`, `03`

  ### Ease of Growth
  - **UUID:** `292e690a-a647-4a4d-b7c3-3839891036c0`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`, `04`

  ### Easy to Grow List Choice
  - **UUID:** `009ab722-f032-431f-ae53-3b82e5f03ece`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

  ### Nurseries
  - **UUID:** `67ad0f8a-d60d-4894-a5d0-7d04942f8159`
  - **Type:** text (multi)
  - **Notes:** Nurseries that Carry this plant.

## Relative Value Matrix
- **UUID:** `1f0b604e-8742-49b7-8a35-c3c5c0d0d7f9`
- **Type:** text (multi)

  ### Has Availability
  - **UUID:** `b1000001-0001-4000-8000-000000000011`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Availability value, 0 otherwise. Source: 94a1c46e-8d0c-4a8b-b951-09ee6b04a43e

  ### Has Climate Rating
  - **UUID:** `b1000001-0001-4000-8000-000000000014`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Climate List Choice value, 0 otherwise. Source: 2cd5ffd7-10f1-431d-945e-064bcfd2c195

  ### Has Deer Resistance
  - **UUID:** `b1000001-0001-4000-8000-000000000005`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Deer Resistance value, 0 otherwise. Source: ff4c4d0e-35d5-4804-aea3-2a6334ef8cb5

  ### Has Drought Tolerant
  - **UUID:** `b1000001-0001-4000-8000-000000000003`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Drought Tolerant value, 0 otherwise. Source: 53aedc01-99c6-4115-903b-7db799966427

  ### Has Easy to Grow
  - **UUID:** `b1000001-0001-4000-8000-000000000012`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Easy to Grow value, 0 otherwise. Source: 009ab722-f032-431f-ae53-3b82e5f03ece

  ### Has Edible Plant
  - **UUID:** `b1000001-0001-4000-8000-000000000013`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Edible Plant value, 0 otherwise. Source: cba229ad-e004-4ece-ac5b-f2bb3ac0c6a5

  ### Has Erosion Control
  - **UUID:** `b1000001-0001-4000-8000-000000000008`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Erosion Control value, 0 otherwise. Source: f3e261e1-2dc8-4abb-8665-3b4cf6521fc6

  ### Has Flammability Rating
  - **UUID:** `b1000001-0001-4000-8000-000000000001`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has List Choice value, 0 otherwise. Source: d996587c-383b-4dc6-a23c-239b7de7e47b

  ### Has Landscape Use
  - **UUID:** `b1000001-0001-4000-8000-000000000007`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Landscape Use value, 0 otherwise. Source: 055d0d05-6927-4ed4-b16c-894fe54d77e0

  ### Has Native Status
  - **UUID:** `b1000001-0001-4000-8000-000000000004`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Native Status value, 0 otherwise. Source: 716f3d8f-195f-4d16-824b-6dd1e88767a6

  ### Has Soils Rating
  - **UUID:** `b1000001-0001-4000-8000-000000000010`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Soils List Choice value, 0 otherwise. Source: 1b3ac1d2-3de1-479d-a472-1db3572971e7

  ### Has Water Amount
  - **UUID:** `b1000001-0001-4000-8000-000000000002`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: 1 if plant has Water Amount value, 0 otherwise. Source: d9174148-6563-4f92-9673-01feb6a529ce

  ### Invasive Component
  - **UUID:** `b1000001-0001-4000-8000-000000000009`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: Invasive value (0 to -3). Source: bacadba3-a4f8-4550-9906-6b5535a619b6

  ### Value Sum Total
  - **UUID:** `b1000001-0001-4000-8000-000000000015`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: Sum of all Value Sum components.

  ### Wildlife Sum Component
  - **UUID:** `b1000001-0001-4000-8000-000000000006`
  - **Type:** text (single)
  - **Calculated:** Yes
  - **Notes:** Calculated: Wildlife Sum value (0-6). Source: e8686d2e-fe16-440e-bc70-af4a0328cd05

## Soils
- **UUID:** `6ce8435d-6db3-47cb-8b83-9ffd97156834`
- **Type:** text (multi)

  ### Improves Soil Health
  - **UUID:** `e98c730f-2d20-45bb-9211-6631354944a9`
  - **Type:** boolean (single)

  ### Soils List Choice
  - **UUID:** `1b3ac1d2-3de1-479d-a472-1db3572971e7`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

## Utility
- **UUID:** `e36ffed4-02e2-4c8e-b1d1-34906c7b1477`
- **Type:** text (multi)

  ### Border & Screening Use
  - **UUID:** `3716c310-ee59-4a31-a7c4-ad86dabfc82a`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`, `04`, `05`, `06`, `07`, `08`, `09`, `10`, `11`

  ### Erosion Control List Choice
  - **UUID:** `f3e261e1-2dc8-4abb-8665-3b4cf6521fc6`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

  ### Erosion control
  - **UUID:** `693acb4c-d593-4168-9a01-6f934933bd8a`
  - **Type:** boolean (single)

  ### Landscape Use
  - **UUID:** `055d0d05-6927-4ed4-b16c-894fe54d77e0`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

  ### Lawn replace
  - **UUID:** `6e67ce02-b338-40f2-a257-87848ca245ef`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

## Water Requirements
- **UUID:** `51f22544-c94b-4f8d-80a4-a249cf9cd281`
- **Type:** text (multi)

  ### Drought Tolerant
  - **UUID:** `af3e70d2-dc9c-4027-a09f-15d7d8b0dd10`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

  ### Drought Tolerant List Choice
  - **UUID:** `53aedc01-99c6-4115-903b-7db799966427`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`

  ### Water Needs
  - **UUID:** `86a2bdd0-c389-43a5-8454-c634c56f9ee1`
  - **Type:** text (multi)

    #### Water Amount
    - **UUID:** `d9174148-6563-4f92-9673-01feb6a529ce`
    - **Type:** text (multi)
    - **Allowed Values:** `01`, `02`, `03`, `04`, `05`

    #### Water Season
    - **UUID:** `5869125b-0b28-4f70-92b9-6e5caa79c1fe`
    - **Type:** text (multi)
    - **Allowed Values:** `01`, `02`, `03`, `04`

## Wildlife Values
- **UUID:** `eac4b48b-b7d9-4281-a109-4c046d2102ee`
- **Type:** text (multi)

  ### Benefits
  - **UUID:** `ff75e529-5b5c-4461-8191-0382e33a4bd5`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`, `04`, `05`, `06`, `07`

  ### Deer Resistance
  - **UUID:** `ff4c4d0e-35d5-4804-aea3-2a6334ef8cb5`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`, `03`, `04`, `05`

  ### Wildlife Sum
  - **UUID:** `dab353f5-defe-4f12-9a3a-f2f7d9aef428`
  - **Type:** text (multi)
  - **Allowed Values:** `01`, `02`

  ### Wildlife Sum (Calculated)
  - **UUID:** `e8686d2e-fe16-440e-bc70-af4a0328cd05`
  - **Type:** text (multi)
  - **Calculated:** Yes
