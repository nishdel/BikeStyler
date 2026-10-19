import type { CatalogueEntry } from './types';

const shared = {
  tags: ['photographic', 'reference-based', 'transparent', 'generated'],
  colours: [], view: 'side', orientation: 'both',
  visualOrigin: 'generated_illustration', embeddingAllowed: true,
  licence: 'Generated asset; manufacturer reference photographs are not redistributed.',
  provenance: 'Prepared with OpenAI ImageGen from manufacturer image references and a bicycle lighting reference. See docs/ASSETS.md for source links and provenance.',
  limitations: ['Generated appearance approximation, not an exact manufacturer photograph.', 'Visualisation only. Appearance does not establish mechanical compatibility.', 'Manual alignment and foreground protection may be needed. Hidden surfaces are not recovered.'],
} satisfies Partial<CatalogueEntry>;

export const PHOTOGRAPHIC_CATALOGUE: CatalogueEntry[] = [
  {
    ...shared, id:'photo-velo-orange-enterprise',category:'wheels',renderer:'wheels',
    name:'Enterprise reference · silver photographic wheel',
    description:'Transparent polished rim, crossing metal spokes and hub. Projected to the confirmed wheel ellipse and axle. Front-wheel reference is an approximate rear-wheel appearance proxy.',
    asset:'/components/photographic/velo-orange-enterprise-front-reference-generated.webp',
    parameters:{wheelPlane:true,imageX:50-625.68/589.83*48,imageY:50-621.50/589.83*48,imageWidth:1254/589.83*48,imageHeight:1254/589.83*48,sourceHubOffsetX:(629-625.68)/589.83*48,sourceHubOffsetY:(641-621.50)/589.83*48},
    anchors:[{name:'attachment',x:50,y:50},{name:'axle',x:50,y:50}],
  },
  {
    ...shared,id:'photo-brooks-b17',category:'saddles',renderer:'saddles',
    name:'B17 reference · racing green leather',
    description:'Photographic leather surface, metal rivets and transparent rail gaps. Racing-green appearance is shared by all selected B17 variants; colour and fine details are approximate.',
    asset:'/components/photographic/brooks-b17-racing-green-reference-generated.webp',
    parameters:{rasterResolution:1000,cropX:60/1774*100,cropY:217/887*100,cropWidth:1670/1774*100,cropHeight:505/887*100,imageX:12.156,imageY:28.129,imageWidth:80,imageHeight:50},
    anchors:[{name:'attachment',x:50,y:50},{name:'rail-clamp',x:50,y:71}],
  },
  {
    ...shared,id:'photo-ene-ciclo-double',category:'cranksets',renderer:'asset',
    name:'ENE Ciclo reference · polished double crank',
    description:'Photographic polished chainrings and a foreshortened arm. Turn and scale the whole crank to align with the source spindle and protected original pedal.',
    asset:'/components/photographic/ene-ciclo-double-foreshortened-generated.webp',
    parameters:{rasterResolution:1000,imageX:10,imageY:10,imageWidth:80,imageHeight:80,imageRotation:-9},
    anchors:[{name:'attachment',x:10+617/1254*80,y:10+678/1254*80}],
  },
];
