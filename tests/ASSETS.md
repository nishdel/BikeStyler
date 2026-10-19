# Test fixture provenance

`sporting-bicycle.jpg`: **Sporting bicycle side view.JPG**, photographed by **Javier Carro**, 12 April 2019. Downloaded without modifications from Wikimedia Commons for local testing.

- Source: <https://commons.wikimedia.org/wiki/File:Sporting_bicycle_side_view.JPG>
- Original: <https://upload.wikimedia.org/wikipedia/commons/d/d0/Sporting_bicycle_side_view.JPG>
- Licence: **Creative Commons Attribution-ShareAlike 4.0 International**, <https://creativecommons.org/licenses/by-sa/4.0/>
- The image demonstrates a difficult cluttered-background import, not successful automatic segmentation. Metadata was removed for publication. No endorsement is implied.

`src/fixture.ts`: original deterministic code-drawn practice bicycle, CC0-1.0. Used as an explicitly illustrated practice project and as reproducible raster input for tests. Generated test photos/project files live in ignored `test-results/`. They are not private photographs and are not presented as proof of arbitrary-photo detection.

`raleigh-road-bike.jpg`: **Raleigh Road Bike.jpg**, photographed by **friedjof** (Wikimedia user Melaenea), 18 August 2017. Downloaded unchanged for local testing.

- Source: <https://commons.wikimedia.org/wiki/File:Raleigh_Road_Bike.jpg>
- Original: <https://upload.wikimedia.org/wikipedia/commons/0/0b/Raleigh_Road_Bike.jpg>
- Licence: **Creative Commons Attribution-ShareAlike 4.0 International**, <https://creativecommons.org/licenses/by-sa/4.0/>
- The prepared portable sample adds manual masking and component annotations. Metadata was removed for publication; derivative photographic material retains CC BY-SA 4.0. No endorsement is implied.

The additional `public/sample/champagne.bike.json` contains the owner's expressly authorized bicycle photograph, isolated on white and sanitized for publication. Its publication test captures the running app and checks save/export/offline reopening. See [asset permissions](../docs/ASSETS.md). Tests make no external network requests.
