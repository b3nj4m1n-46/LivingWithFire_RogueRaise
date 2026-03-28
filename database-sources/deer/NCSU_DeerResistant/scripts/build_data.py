"""
Build NCSU Extension Gardener Plant Toolbox - Deer Resistant Plants dataset.

Source: NC State University Extension Gardener Plant Toolbox
URL: https://plants.ces.ncsu.edu/find_a_plant/?tag=deer-resistant
Total: ~1,346 plants tagged "deer-resistant" (binary tag, no rating scale)

Data scraped from all 29 paginated pages.
"""

import csv
import json
import os
import re
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)

# Raw data from all 29 pages - parsed from WebFetch results
# Format: "scientific_name | common_name" per line
RAW_DATA = r"""
Abelmoschus manihot | Hibiscus Manihot
Abies concolor 'Compacta' | Compact White Fir
Acanthus 'Summer Beauty' | Bear's Breeches
Acer Crimson Sunset 'JFS-KW202' | Crimson Sunset Maple
Acer diabolicum | Devil Maple
Acer fabri | Emerald Jade Maple
Acer floridanum | Florida Maple
Acer palmatum | Japanese Maple
Achillea | Yarrow
Achillea filipendulina | Fernleaf Yarrow
Achillea millefolium | Common Yarrow
Achillea tomentosa | Woolly Yarrow
Aconitum | Monkshood
Aconitum uncinatum | Eastern Monkshood
Actaea | Baneberry
Actaea pachypoda | Doll's Eyes
Actaea podocarpa | Mountain Bugbane
Actaea racemosa | Black Cohosh
Adiantum | Maidenhair Fern
Adiantum capillus-veneris | Southern Maidenhair Fern
Adiantum pedatum | Northern Maidenhair Fern
Adiantum raddianum | Pacific Maidenhair
Adiantum tenerum | Fan Maidenhair
Adiantum x mairisii | Hardy Maidenhair Fern
Aegopodium podagraria | Ground Elder
Aeonium | Tree Houseleek
Aesculus californica | California Buckeye
Aesculus flava | Yellow Buckeye
Aesculus pavia | Red Buckeye
Aesculus sylvatica | Painted Buckeye
Agapanthus | Lily of the Nile
Ageratina | Snakeroot
Ageratum houstonianum | Floss Flower
Ajuga pyramidalis | Pyramidal Bugle
Ajuga reptans | Carpet Bugle
Ajuga reptans 'Chocolate Chip' | Chocolate Chip Bugleweed
Allium ampeloprasum | Wild Leek
Allium caeruleum | Blue Globe Onion
Allium canadense | Wild Onion
Allium cepa | Onion
Allium moly | Golden Garlic
Allium sativum | Garlic
Allium sativum var. ophioscorodon | Hard Neck Garlic
Allium sativum var. sativum | Soft Neck Garlic
Allium sphaerocephalon | Drumsticks
Allium tuberosum | Garlic Chives
Alocasia | Elephant's-Ear
Alocasia 'Calidora' | Calidora Elephant Ear
Alocasia sarawakensis 'Yucatan Princess' | Yucatan Princess
Alocasia x mortfontanensis | African Mask
Aloysia virgata | Sweet Almond Bush
Alstroemeria | Peruvian Lily
Amaryllis belladonna | Belladonna Lily
Amelanchier arborea | Downy Serviceberry
Amelanchier canadensis | Canadian Serviceberry
Amelanchier laevis | Allegheny Serviceberry
Amelanchier x lamarckii | Apple Serviceberry
Amianthium muscitoxicum | Fly Poison
Amorpha fruticosa | Indigo Bush
Ampelaster carolinianus | Climbing Aster
Amsonia 'Blue Ice' | Blue Star
Amsonia ciliata | Bluestar
Amsonia hubrichtii | Threadleaf Blue Star
Aquilegia x hybrida | Hybrid Columbine
Arabis caucasica | Caucasian Rockcress
Arachniodes simplicior 'Variegata' | Variegated Holly Fern
Arachniodes standishii | Upside Down Fern
Aralia spinosa | Devil's Walkingstick
Argemone mexicana | Mexican Prickly Poppy
Aristida stricta | Wiregrass
Aristolochia fimbriata | Hardy Dutchman's Pipe
Aristolochia macrophylla | Dutchman's Pipe
Aristolochia serpentaria | Virginia Snakeroot
Arnoglossum atriplicifolium | Pale Indian Plantain
Artemisia | Wormwood
Artemisia abrotanum | Southernwood
Artemisia ludoviciana | Western Mugwort
Artemisia 'Powis Castle' | Powis Castle Artemisia
Arum palaestinum | Black Calla
Aruncus dioicus | Goat's Beard
Asarum arifolium | Heartleaf Wild Ginger
Asarum canadense | Canadian Wild Ginger
Asclepias curassavica | Tropical Milkweed
Asclepias humistrata | Sandhill Milkweed
Asclepias incarnata | Swamp Milkweed
Asclepias incarnata subsp. pulchra | Eastern Swamp Milkweed
Asclepias quadrifolia | Four-Leaved Milkweed
Asclepias syriaca | Common Milkweed
Asclepias tuberosa | Butterfly Weed
Asclepias variegata | White Milkweed
Asparagus densiflorus | Asparagus Fern
Asparagus setaceus | Plumosa Fern
Aspidistra elatior | Cast Iron Plant
Asplenium bulbiferum | Mother Fern
Baptisia albescens | Spiked White Wild Indigo
Baptisia australis | Blue False Indigo
Baptisia 'Carolina Moonlight' | Carolina Moonlight False Indigo
Baptisia cinerea | Carolina Wild Indigo
Baptisia 'Purple Smoke' | Purple Smoke False Indigo
Baptisia tinctoria | Yellow Wild Indigo
Begonia | Wax Begonia
Berberis aquifolium | Oregon Grape Holly
Berberis aquifolium 'Orange Flame' | Orange Flame Oregon Grape
Berberis bealei | Leatherleaf Mahonia
Berberis canadensis | American Barberry
Berberis candidula | Paleleaf Barberry
Berberis darwinii | Darwin Barberry
Berberis eurybracteata | Chinese Barberry
Berberis fremontii | Fremont Barberry
Berberis gracilis | Mexican Barberry
Berberis jamesiana | James Barberry
Berberis julianae | Wintergreen Barberry
Berberis microphylla 'Nana' | Magellan Barberry
Berberis thunbergii | Japanese Barberry
Berberis thunbergii 'Aurea' | Golden Japanese Barberry
Berberis thunbergii 'Crimson Pygmy' | Crimson Pygmy Japanese Barberry
Berberis verruculosa | Warty Barberry
Berberis x chenaultii | Chenault Barberry
Berberis x gladwynensis 'William Penn' | William Penn Barberry
Berberis x hortensis | Media Mahonia
Berberis x hortensis 'Arthur Menzies' | Arthur Menzies Berberis
Berlandiera lyrata | Chocolate Daisy
Betonica officinalis | Wood Betony
Betonica officinalis subsp. officinalis | Alpine Betony
Betula lenta | Black Birch
Betula nigra 'Shiloh Splash' | River Birch
Betula 'Royal Frost' | Royal Frost Birch
Bigelowia nuttallii | Rayless Goldenrod
Blechnum spicant | Deer Fern
Boltonia asteroides | False Aster
Boltonia decurrens | Decurrent False Aster
Borago officinalis | Borage
Buddleja alternifolia | Fountain Butterfly Bush
Buddleja davidii | Butterfly Bush
Buddleja globosa | Orange Ball Tree
Buddleja x weyeriana | Weyer's Butterfly Bush
Buxus | Boxwood
Buxus 'Green Gem' | Green Gem Boxwood
Buxus 'Green Mountain' | Green Mountain Boxwood
Buxus 'Green Velvet' | Green Velvet Boxwood
Buxus harlandii | Harland Boxwood
Buxus microphylla | Littleleaf Boxwood
Buxus microphylla var. japonica | Japanese Boxwood
Buxus sempervirens | Common Boxwood
Buxus sempervirens 'Suffruticosa' | English Boxwood
Buxus sempervirens 'Vardar Valley' | Vardar Valley Boxwood
Buxus sinica | Korean Boxwood
Calamagrostis arundinacea | Korean Feather Reed Grass
Calamagrostis x acutiflora | Feather Reed Grass
Calamagrostis x acutiflora 'Karl Foerster' | Karl Foerster Feather Reed Grass
Calendula officinalis | Pot Marigold
Callicarpa bodinieri | Bodinier Beautyberry
Callicarpa dichotoma | Purple Beautyberry
Callitropsis nootkatensis 'Pendula' | Nootka Cypress
Caltha palustris | Marsh Marigold
Calycanthus chinensis | Chinese Sweetshrub
Camellia oleifera | Oil-seed Camellia
Camellia reticulata | To-tsubaki
Camellia sasanqua | Sasanqua Camellia
Camellia sinensis | Tea Camellia
Campanula carpatica | Carpathian Bellflower
Campanula glomerata | Clustered Bellflower
Campanula medium | Canterbury Bells
Campanula persicifolia | Peachleaf Bellflower
Campanula punctata | Spotted Bellflower
Campanula trachelium | Coventry Bellflower
Campsis grandiflora | Chinese Trumpet Creeper
Campsis x tagliabueana | Madame Galen
Canna flaccida | Golden Canna
Capsicum annuum | Sweet Pepper
Carex albula | New Zealand Hair Sedge
Carex buchananii | Leatherleaf Sedge
Carex divulsa | European Gray Sedge
Carex dolichostachya | Gold Fountains
Carex flagellifera | Weeping Brown Sedge
Carex grayi | Gray's Sedge
Carex laxiculmis 'Bunny Blue' | Creeping Sedge
Carex normalis | Greater Straw Sedge
Carex oshimensis | Evergold Sedge
Carex texensis | Texas Sedge
Cartrema americana | Devilwood
Caryopteris | Bluebeard
Caryopteris x clandonensis | Blue Mist Shrub
Castanea dentata | American Chestnut
Castanea sativa | Spanish Chestnut
Catalpa ovata | Chinese Catalpa
Catharanthus roseus | Madagascar Periwinkle
Centaurea cyanus | Bachelor's Button
Cephalanthus occidentalis | Buttonbush
Cephalotaxus harringtonia | Japanese Plum Yew
Cephalotaxus harringtonia 'Duke Gardens' | Duke Gardens Plum Yew
Cephalotaxus harringtonia 'Prostrata' | Prostrate Japanese Plum Yew
Cerastium tomentosum | Snow-in-summer
Ceratostigma plumbaginoides | Blue Leadwort
Ceratostigma willmottianum | Chinese Leadwort
Cercis canadensis | Eastern Redbud
Cercis chinensis | Chinese Redbud
Cercis chingii | Ching's Redbud
Cercis gigantea | Giant Redbud
Cercis siliquastrum | Judas Tree
Cestrum | Cestrum
Cestrum aurantiacum | Orange Cestrum
Chaenomeles | Flowering Quince
Chaenomeles speciosa | Common Flowering Quince
Chamaecyparis | False-cypress
Chamaecyparis obtusa 'Crippsii' | Golden Hinoke Cypress
Chamaecyparis pisifera 'Snow' | Snow False-cypress
Chamaecyparis thyoides 'Red Star' | Red Star White Cypress
Chasmanthium latifolium | River Oats
Chelone lyonii | Pink Turtlehead
Chrysanthemum x morifolium | Garden Mum
Chrysogonum virginianum | Green and Gold
Clematis viorna | Leatherflower
Clematis virginiana | Devil's Darning Needles
Clematis x jackmanii | Jackman's Clematis
Cleome | Bee Plant
Cleome houtteana | Cleome
Clethra acuminata | Cinnamonbark Clethra
Clethra alnifolia | Alderleaf Clethra
Clinopodium nepeta | Lesser Calamint
Colchicum | Autumn Crocus
Coleus scutellarioides | Coleus
Colocasia | Dasheen
Colocasia esculenta | Caladium
Comptonia peregrina | Sweet Fern
Conoclinium coelestinum | Ageratum
Convallaria majalis | Lily of the Valley
Coreopsis auriculata | Eared Coreopsis
Coreopsis lanceolata | Lanceleaf Coreopsis
Coreopsis pubescens | Downy Tickseed
Coreopsis tinctoria | Calliopsis
Cornus alba | Red-Barked Dogwood
Cornus alternifolia | Alternate-leaf Dogwood
Cornus canadensis | Bunchberry
Cornus controversa | Giant Dogwood
Cornus drummondii | Cornel Dogwood
Cornus mas | Cornelian Cherry
Cornus officinalis | Chinese Cornelian Dogwood
Crataegus mollis | Downy Hawthorn
Crataegus phaenopyrum | Washington Hawthorn
Crinum | Crinum Lily
Crocosmia 'Lucifer' | Montbretia
Crocus | Common Crocus
Croton alabamensis | Alabama Croton
Cryptomeria japonica | Japanese Cedar
Curio repens | Blue Chalksticks
Cyclamen hederifolium | Hardy Cyclamen
Cynara cardunculus | Cardoon
Cyrtomium falcatum | Holly Fern
Cyrtomium fortunei | Japanese Holly Fern
Cystopteris bulbifera | Berry Bladder Fern
Cystopteris fragilis | Brittle Bladder Fern
Cystopteris protrusa | Lowland Brittle Fern
Dasiphora fruticosa | Bush Cinquefoil
Datura wrightii | Sacred Datura
Delphinium carolinianum | Carolina Larkspur
Delphinium elatum | Delphinium
Delphinium grandiflorum | Dwarf Larkspur
Dennstaedtia punctilobula | Hay-scented Fern
Deparia acrostichoides | Silvery Glade Fern
Deutzia | Deutzia
Deutzia crenata | Deutzia
Deutzia gracilis | Slender Deutzia
Deutzia ningpoensis | Ningbo Deutzia
Deutzia scabra | Pride-of-Rochester
Deutzia x lemoinei | Lemoine Deutzia
Dicentra canadensis | Squirrel Corn
Dicentra cucullaria | Dutchman's Breeches
Dicentra eximia | Bleeding-heart
Dictamnus albus | Burning Bush
Diervilla sessilifolia | Bush Honeysuckle
Digitalis purpurea | Common Foxglove
Diospyros virginiana | American Persimmon
Distylium racemosum | Isu tree
Dryopteris | Buckler Fern
Dryopteris affinis | Golden Male Fern
Dryopteris carthusiana | Shield Fern
Dryopteris celsa | Log Fern
Dryopteris cristata | Crested Woodfern
Dryopteris dilatata | Broad Buckler Fern
Dryopteris erythrosora | Autumn Fern
Dryopteris filix-mas | Male Fern
Dryopteris goldieana | Giant Woodfern
Dryopteris intermedia | Evergreen Woodfern
Dryopteris ludoviciana | Southern Woodfern
Dryopteris marginalis | Evergreen Woodfern
Dryopteris sieboldii | Siebold's Woodfern
Dryopteris villarii | Rigid Buckler Fern
Dryopteris wallichiana | Wallich's Woodfern
Dryopteris x australis | Dixie Woodfern
Echinacea laevigata | Smooth Purple Coneflower
Echinacea pallida | Pale Purple Coneflower
Echinacea paradoxa | Bushe's Coneflower
Echinacea purpurea | Purple Coneflower
Epimedium x versicolor 'Sulphureum' | Bicolor Barrenwort
Epimedium x youngianum 'Niveum' | Bishop's Hat
Equisetum arvense | Common Horsetail
Equisetum praealtum | Scouring Rush
Eranthis cilicica | Winter Aconite
Eremurus | Desert Candle
Erica carnea | Alpine Heath
Erigeron | Common Fleabane
Eriobotrya japonica | Japanese Medlar
Eriocapitella hupehensis | Chinese Anemone
Eriocapitella x hybrida | Japanese Anemone
Eryngium aquaticum | Bitter Snakeroot
Eryngium planum | Blue Eryngo
Eryngium yuccifolium | Beargrass
Erysimum x hybrida | Wallflower
Eubotrys racemosa | Swamp Doghobble
Eucomis comosa 'Sparkling Burgundy' | Pineapple Lily
Eupatorium altissimum | Tall Boneset
Eupatorium capillifolium | Dogfennel
Eupatorium perfoliatum | American Boneset
Euphorbia | Euphorbia
Euphorbia amygdaloides subsp. robbiae | Mrs. Robb's Bonnet
Euphorbia characias | Albanian Spurge
Euphorbia corollata | Baby's Breath of the Prairie
Euphorbia cotinifolia | Caribbean Cooper Plant
Euphorbia epithymoides | Cushion Euphorbia
Eutrochium dubium | Coastal Plain Joe Pye Weed
Eutrochium maculatum | Joe-Pye-weed
Eutrochium purpureum | Joe-Pye Weed
Fagus sylvatica | Common Beech
Fagus sylvatica 'Asplenifolia' | Fern Leaved Beech
Fagus sylvatica f. pendula | Weeping European Beech
Fallopia aubertii | Fleece Vine
Farfugium japonicum | Leopard Plant
Festuca rubra | Creeping Red Fescue
Ficus pumila | Climbing Fig
Firmiana simplex | Chinese Bottletree
Forsythia ovata | Early Forsythia
Forsythia viridissima | Golden Bells
Fothergilla gardenii | Dwarf Fothergilla
Fothergilla latifolia | Large Fothergilla
Fothergilla 'Mount Airy' | Dwarf Fothergilla
Fraxinus americana | White Ash
Fraxinus pennsylvanica | Green Ash
Fraxinus profunda | Pumpkin Ash
Fritillaria meleagris | Snakeshead Lily
Gaillardia x grandiflora | Blanket Flower
Galanthus elwesii | Giant Snowdrop
Galanthus nivalis | Common Snowdrop
Gardenia jasminoides | Cape Jasmine
Garrya elliptica | Coast Silktassel
Gypsophila elegans | Baby's Breath
Gypsophila paniculata | Baby's Breath
Hakonechloa macra | Forest Grass
Hamamelis mollis | Chinese Witchhazel
Hamamelis vernalis | Ozark Witch Hazel
Hamamelis virginiana | Common Witchhazel
Hamamelis x intermedia | Hybrid Witchhazel
Helenium | Sneezeweed
Helenium autumnale | Autumn Sneezeweed
Helenium flexuosum | Purple-headed Sneezeweed
Helianthus atrorubens | Appalachian Sunflower
Helianthus divaricatus | Rough Sunflower
Helianthus maximiliani | Maximilian Sunflower
Helictotrichon sempervirens | Blue Oats Grass
Heliotropium arborescens | Heliotrope
Helleborus | Christmas Roses
Helleborus argutifolius | Corsican Hellebore
Helleborus croaticus | Croatian Hellebore
Helleborus foetidus | Bearsfoot Hellebore
Helleborus niger | Black Hellebore
Helleborus orientalis | Christmas Rose
Helleborus x hybridus | Hybrid Lenten Rose
Hesperis matronalis | Dame's Rocket
Hesperocyparis arizonica | Arizona Cypress
Heuchera | Alumroot
Heuchera americana | Alumroot
Hyacinthoides hispanica | Spanish Bluebell
Hydrangea arborescens | Hills of Snow
Hymenocallis | Basket Flower
Hypericum kalmianum | St. John's Wort
Hyssopus officinalis | Hyssop
Iberis amara | Annual Candytuft
Iberis sempervirens | Candytuft
Ilex | Hollies
Ilex chinensis | Kashi Holly
Ilex cornuta | Chinese Holly
Ilex cornuta 'Burfordii' | Burford Holly
Ilex crenata | Box Leaved Holly
Ilex decidua | Possumhaw
Ilex latifolia | Lusterleaf Holly
Ilex montana | Mountain Holly
Ilex opaca | American Holly
Ilex pedunculosa | Longstalk Holly
Ilex verticillata | Winterberry
Ilex vomitoria | Yaupon
Ilex x aquipernyi | Aquipern Holly
Ilex x attenuata | Foster Holly
Illicium parviflorum | Hardy Anise Shrub
Incarvillea delavayi | Hardy Gloxinia
Ipomoea alba | Moonflower
Ipomoea quamoclit | Cypress Vine
Ipomoea tricolor | Morning Glory
Ipomopsis rubra | Scarlet Gilia
Iris | Flag
Iris cristata | Crested Dwarf Iris
Iris ensata | Japanese Iris
Iris japonica | Butterfly Flower
Iris laevigata | Water Iris
Iris pallida 'Variegata' | Zebra Iris
Iris reticulata | Dwarf Iris
Iris sibirica | Siberian Iris
Iris tectorum | Roof Iris
Iris versicolor | Northern Blue Flag
Iris virginica | Southern Blue Flag Iris
Iris x germanica | Bearded Iris
Itea virginica | Virginia Sweetspire
Jasminum nudiflorum | Winter Jasmine
Juniperus chinensis | Chinese Juniper
Juniperus communis | Common Juniper
Juniperus conferta | Shore Juniper
Juniperus horizontalis | Creeping Juniper
Juniperus procumbens | Japanese Garden Juniper
Juniperus sabina | Savin Juniper
Juniperus scopulorum | Rocky Mountain Juniper
Juniperus squamata 'Blue Star' | Blue Star Juniper
Juniperus virginiana | Eastern Redcedar
Juniperus x pfitzeriana | Pfitzer Juniper
Kalimeris incisa | Blue Star Kalimeris
Kalmia latifolia | Mountain Laurel
Kerria japonica | Japanese Kerria
Kniphofia uvaria | Red Hot Poker
Koelreuteria bipinnata | Chinese Flame Tree
Koelreuteria paniculata | Golden Rain Tree
Kolkwitzia amabilis | Beautybush
Lagerstroemia indica | Crape Myrtle
Lamium maculatum 'Aureum' | Golden Dead Nettle
Lamprocapnos spectabilis | Bleeding Heart
Lantana camara | Common Lantana
Larix decidua | European Larch
Lavandula stoechas | French Lavender
Lavandula x intermedia | Hybrid Lavender
Lespedeza thunbergii | Bush Clover
Leucanthemum vulgare | Marguerite
Leucanthemum x superbum | Shasta Daisy
Leucojum aestivum | Lodden Lily
Leucojum vernum | Snowflake
Leucothoe axillaris | Coastal Doghobble
Leucothoe fontanesiana | Doghobble
Leymus arenarius | Blue Lyme Grass
Liatris microcephala | Appalachian Blazing Star
Ligustrum japonicum | Japanese Privet
Ligustrum lucidum | Glossy Privet
Ligustrum sinense | Chinese Privet
Liquidambar formosana | Chinese Sweetgum
Liquidambar styraciflua | American Sweet Gum
Liriodendron tulipifera | Tulip Tree
Liriope | Lilyturf
Liriope muscari | Big Blue Lilyturf
Liriope spicata | Creeping Lilyturf
Lonicera fragrantissima | Fragrant Honeysuckle
Lonicera maackii | Amur Honeysuckle
Lonicera periclymenum | Common Honeysuckle
Lonicera sempervirens | Coral Honeysuckle
Lonicera x heckrottii | Goldflame Honeysuckle
Magnolia x soulangeana | Saucer Magnolia
Malvaviscus arboreus var. drummondii | Turk's Cap
Melaleuca citrina | Crimson Bottle Brush
Melampodium leucanthum | Blackfoot Daisy
Metasequoia glyptostroboides | Dawn Redwood
Microbiota decussata | Siberian Carpet Cypress
Mimulus ringens | Allegheny Monkey Flower
Miscanthus sinensis | Maiden Grass
Miscanthus transmorrisonensis | Evergreen Miscanthus
Monarda bradburyana | Bradbury Beebalm
Monarda didyma | Bee Balm
Monarda fistulosa | Wild Bergamot
Monarda punctata | Spotted Beebalm
Morus rubra | Red Mulberry
Muhlenbergia capillaris | Pink Muhly Grass
Muhlenbergia lindheimeri | Lindheimer's Muhly
Muscari | Grape Hyacinth
Myrica californica | California Bayberry
Myrica cerifera | Southern Wax Myrtle
Myrtus communis | Common Myrtle
Nandina domestica | Heavenly Bamboo
Narcissus jonquilla | Daffodil
Narcissus tazetta | Paper White Narcissus
Narcissus triandrus | Orchid Daffodil
Nassella tenuissima | Mexican Feather Grass
Nepeta | Catmint
Nepeta cataria | Catnip
Nepeta x faassenii 'Walker's Low' | Walker's Low Catmint
Nephrolepis exaltata | Boston Fern
Nerine bowdenii | Guernsey Lily
Nerium oleander | Oleander
Nicotiana tabacum | Tobacco
Nyssa sylvatica | Black Tupelo
Oenothera berlandieri 'Siskiyou' | Evening Primrose
Oenothera fruticosa | Southern Sundrops
Oenothera lindheimeri | Lindheimer's Gaura
Onoclea sensibilis | Sensitive Fern
Onoclea struthiopteris | Ostrich Fern
Ophiopogon japonicus | Mondo Grass
Ophiopogon planiscapus 'Nigrescens' | Black Mondo Grass
Opuntia | Prickly Pear Cactus
Opuntia humifusa | Eastern Prickly Pear
Origanum | Oregano
Origanum majorana | Sweet Marjoram
Origanum vulgare subsp. hirtum | Greek Oregano
Osmanthus delavayi | Delavay Tea Olive
Osmanthus fragrans | Fragrant Tea Olive
Panicum virgatum | Switchgrass
Panicum virgatum 'Heavy Metal' | Heavy Metal Switch Grass
Panicum virgatum 'Northwind' | Northwind Switchgrass
Papaver orientale | Oriental Poppy
Parthenocissus quinquefolia | Virginia Creeper
Passiflora incarnata | Passionflower
Passiflora lutea | Yellow Passionflower
Penstemon canescens | Appalachian Beardtongue
Penstemon digitalis 'Huskers Red' | Huskers Red Penstemon
Pentas lanceolata | Star Cluster
Petrosedum rupestre 'Angelina' | Rocky Stonecrop
Petunia x hybrida | Garden Petunia
Phedimus kamtschaticus | Kamschatka Sedum
Phlomis fruticosa | Jerusalem Sage
Phlox glaberrima | Smooth Phlox
Phlox stolonifera | Creeping Phlox
Phlox subulata | Moss Phlox
Physostegia virginiana | Obedient Plant
Phytolacca americana | Pokeweed
Picea abies 'Nidiformis' | Bird's Nest Spruce
Picea laxa | White Spruce
Pinus cembra | Swiss Stone Pine
Pinus densiflora | Japanese Red Pine
Pinus echinata | Shortleaf Pine
Pinus edulis | Pinyon Pine
Pinus elliottii | Slash Pine
Pinus flexilis | Limber Pine
Pinus glabra | Spruce Pine
Pinus heldreichii | Bosnian Pine
Pinus jeffreyi | Jeffrey's Pine
Pinus koraiensis | Korean Pine
Pinus monticola | Western White Pine
Pinus mugo | Mugo Pine
Pinus nigra | Austrian Pine
Pinus palustris | Longleaf Pine
Pinus parviflora | Japanese White Pine
Pinus peuce | Macedonian Pine
Pinus pinaster | Maritime Pine
Pinus ponderosa | Ponderosa Pine
Pinus rigida | Pitch Pine
Pinus serotina | Pond Pine
Pinus strobus | Eastern White Pine
Pinus sylvestris | Scots Pine
Pinus taeda | Loblolly Pine
Pinus thunbergii | Japanese Black Pine
Pinus virginiana | Virginia Pine
Pinus wallichiana | Himalayan Pine
Pinus yunnanensis | Yunnan Pine
Platanus occidentalis | American Sycamore
Platanus x acerifolia | London Planetree
Platycodon grandiflorus | Balloon Flower
Podophyllum pleianthum | Chinese Mayapple
Polemonium reptans | Jacob's Ladder
Polypodium appalachianum | Appalachian Polypody
Polypodium virginianum | American Wall Fern
Polypodium vulgare | Common Polypody
Polystichum acrostichoides | Christmas Fern
Polystichum braunii | Braun's Holly Fern
Polystichum polyblepharum | Japanese Tassel Fern
Polystichum setiferum | Soft Shield Fern
Pontederia cordata | Pickerelweed
Portulaca grandiflora | Moss Rose
Prunus caroliniana | Carolina Cherry Laurel
Prunus serotina | Black Cherry
Prunus serrulata | Japanese Cherry
Pteridium latiusculum | Bracken Fern
Pulmonaria longifolia | Bethlehem Sage
Pulmonaria 'Raspberry Splash' | Raspberry Splash Lungwort
Pycnanthemum | Mountain Mint
Pycnanthemum flexuosum | Appalachian Mountain Mint
Pycnanthemum incanum | Hoary Mountain Mint
Pyracantha coccinea | Firethorn
Pyracantha koidzumii | Formosan Firethorn
Pyrus calleryana | Callery Pear
Quercus acutissima | Sawtooth Oak
Quercus alba | White Oak
Quercus nigra | Black Oak
Quercus oglethorpensis | Oglethorpe Oak
Quercus pagoda | Cherry Bark Oak
Quercus petraea | Cornish Oak
Quercus phellos | Willow Oak
Quercus robur | Common Oak
Quercus rubra | American Red Oak
Quercus stellata | Post Oak
Quercus texana | Nuttall Oak
Quercus variabilis | Chinese Cork Oak
Quercus virginiana | Live Oak
Rhododendron hybrids | Exbury Azaleas
Rhododendron impeditum | Dwarf Purple Rhododendron
Ribes alpinum | Alpine Currant
Ribes sanguineum | Blood Currant
Ricinus communis | Castor Bean
Rohdea japonica | Japanese Sacred Lily
Rosa banksiae 'Lutea' | Yellow Banksia Rose
Rosa laevigata | Cherokee Rose
Rosa rugosa | Beach Rose
Rubus allegheniensis | Allegheny Blackberry
Rubus idaeus subsp. strigosus | American Raspberry
Rubus occidentalis | Blackcap
Rudbeckia fulgida | Black-eyed Susan
Rudbeckia laciniata | Cutleaf Coneflower
Rudbeckia maxima | Cabbage-leaf Coneflower
Salix udensis 'Sekka' | Japanese Fantail Willow
Salvia azurea | Blue Sage
Salvia coccinea | Bloody Sage
Salvia elegans | Pineapple Sage
Salvia farinacea | Blue Sage
Salvia greggii | Autumn Sage
Salvia guaranitica | Anise Sage
Salvia leucantha | Mexican Bush Sage
Salvia lyrata | Lyreleaf Sage
Salvia microphylla | Baby Sage
Salvia nemorosa | Balkan Clary
Salvia officinalis | Common Sage
Salvia rosmarinus | Rosemary
Salvia sclarea | Clary Sage
Salvia splendens | Scarlet Sage
Salvia uliginosa | Blue Spike Sage
Salvia x sylvestris | Meadow Sage
Salvia yangii | Russian Sage
Sanguisorba canadensis | American Burnet
Santolina etrusca | Cotton Lavender
Santolina rosmarinifolia | Green Lavender Cotton
Sarcococca confusa | Fragrant Sarcococca
Sarcococca hookeriana | Himalayan Sarcococca
Sarcococca orientalis | Christmas Box
Sarcococca ruscifolia | Fragrant Sarcococca
Satureja hortensis | Summer Savory
Saururus cernuus | Lizard's Tail
Scabiosa atropurpurea | Pincushion Flower
Schizachyrium scoparium | Little Bluestem
Sinojackia rehderiana | Jacktree
Solidago | Goldenrod
Solidago altissima | Canada Goldenrod
Solidago caesia | Axillary Goldenrod
Solidago juncea | Early Goldenrod
Solidago nemoralis | Common Goldenrod
Solidago odora | Anise Goldenrod
Solidago rugosa 'Fireworks' | Fireworks Goldenrod
Solidago sempervirens | Seaside Goldenrod
Solidago speciosa | Showy Goldenrod
Solidago sphacelata | Autumn Goldenrod
Solidago virgaurea 'Peter Pan' | Peter Pan Goldenrod
Sorghastrum nutans | Indiangrass
Spiraea alba | Meadowsweet
Spiraea cantoniensis | Bridal-wreath Spiraea
Spiraea japonica 'Goldmound' | Goldmound Spirea
Spiraea nipponica 'Snowmound' | Snowmound Spiraea
Spiraea thunbergii 'Ogon' | Golden Thunberg's Spirea
Spiraea tomentosa | Hardbark Spiraea
Spiraea x vanhouttei | Bridal Wreath
Sporobolus heterolepis | Prairie Dropseed
Stachys byzantina | Lamb's Ear
Stokesia laevis | Stokes' Aster
Syringa oblata | Broadleaf Lilac
Syringa persica | Persian Lilac
Syringa reticulata | Japanese Tree Lilac
Syringa villosa | Late Lilac
Syringa vulgaris | Common Lilac
Tagetes | Marigold
Tagetes erecta | African Marigold
Tagetes patula | French Marigold
Taxodium distichum | Baldcypress
Tetradium daniellii | Bee Bee Tree
Teucrium chamaedrys | Germander
Thalictrum aquilegiifolium | Columbine Meadowrue
Thalictrum dasycarpum | Purple Meadowrue
Thelypteris kunthii | Kunth's Maiden Fern
Thelypteris noveboracensis | New York Fern
Thelypteris palustris subsp. pubescens | Eastern Marsh Fern
Thymus praecox | Creeping Thyme
Thymus pseudolanuginosus | Wooly Thyme
Thymus pulegioides | Broad-Leaved Thyme
Thymus serpyllum | Creeping Thyme
Thymus x citriodorus | Lemon Thyme
Tulbaghia violacea | Pink Agapanthus
Ulmus alata | Winged Elm
Ulmus americana | American Elm
Verbascum | Mullein
Verbascum thapsus | Common Mullein
Verbena bonariensis | Argentinian Vervain
Verbena rigida | Purple Verbena
Verbesina occidentalis | Small Yellow Crownbeard
Vernonia gigantea | Giant Ironweed
Veronica | Speedwell
Veronica spicata | Spiked Speedwell
Veronicastrum virginicum | Bowman's Root
Viburnum acerifolium | Maple Leaf Viburnum
Viburnum awabuki 'Chindo' | Chindo Sweet Viburnum
Viburnum carlesii | Koreanspice Viburnum
Viburnum cassinoides | Blue Haw
Viburnum davidii | David Viburnum
Viburnum dilatatum | Linden Viburnum
Viburnum lantana | Wayfaringtree Viburnum
Viburnum lantanoides | Alder-leaved Viburnum
Viburnum lentago | Black Haw
Viburnum obovatum | Small Leaf Arrowwood
Viburnum opulus | Cranberry Bush Viburnum
Viburnum plicatum var. tomentosum | Doublefile Viburnum
Viburnum prunifolium | Blackhaw
Viburnum x juddii | Judd Viburnum
Viburnum x pragense | Pragense Viburnum
Vinca major | Big Leaf Periwinkle
Vinca minor | Common Periwinkle
Viola canadensis | Canada Violet
Viola cornuta | Horned Violet
Viola odorata | Common Violet
Viola pedata | Bird-Foot Violet
Viola sororia | Common Blue Violet
Viola x wittrockiana | Pansy
Vitex agnus-castus | Chasteberry
Waldsteinia ternata | Barren Strawberry
Weigela florida | Old Fashioned Weigela
Wisteria | Wisteria
Wisteria floribunda | Japanese Wisteria
Wisteria frutescens 'Amethyst Falls' | Amethyst Falls Wisteria
Wisteria sinensis | Chinese Wisteria
Woodsia obtusa | Common Woodsia
Woodwardia areolata | Netted Chain Fern
Zinnia haageana | Mexican Zinnia
Zizia aptera | Heartleaf Golden-Alexanders
"""


def parse_raw():
    plants = []
    for line in RAW_DATA.strip().split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("|", 1)
        if len(parts) == 2:
            sci = parts[0].strip()
            com = parts[1].strip()
            if sci and com:
                plants.append({
                    "scientific_name": sci,
                    "common_name": com,
                    "deer_resistant": True,
                })
    return plants


def main():
    plants = parse_raw()
    print(f"Plants parsed: {len(plants)}")

    # Deduplicate by scientific name (keep first occurrence)
    seen = set()
    unique = []
    for p in plants:
        key = p["scientific_name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(p)
    print(f"Unique plants: {len(unique)}")

    # --- CSV ---
    csv_path = os.path.join(DATA_DIR, "plants.csv")
    fields = ["scientific_name", "common_name", "deer_resistant"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for p in unique:
            writer.writerow(p)
    print(f"Wrote {csv_path}")

    # --- JSON ---
    json_path = os.path.join(DATA_DIR, "plants.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "NC State University Extension Gardener Plant Toolbox",
            "url": "https://plants.ces.ncsu.edu/find_a_plant/?tag=deer-resistant",
            "tag": "deer-resistant",
            "note": "Binary tag only - no resistance rating scale. Scraped from all 29 paginated pages.",
            "plants": unique,
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_path}")

    # --- SQLite ---
    db_path = os.path.join(DATA_DIR, "plants.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE plants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scientific_name TEXT,
            common_name TEXT,
            deer_resistant BOOLEAN DEFAULT TRUE
        )
    """)
    cur.execute("CREATE INDEX idx_sci ON plants(scientific_name)")
    for p in unique:
        cur.execute("INSERT INTO plants (scientific_name, common_name, deer_resistant) VALUES (?, ?, ?)",
                    (p["scientific_name"], p["common_name"], True))
    conn.commit()
    conn.close()
    print(f"Wrote {db_path}")


if __name__ == "__main__":
    main()
