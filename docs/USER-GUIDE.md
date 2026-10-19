# Using BikeStyler

## Prepare a photo

Use a clear side photograph with the whole bicycle visible. JPG, PNG and WebP imports are supported. The setup editor provides automatic border-colour removal and manual brush/polygon correction. Review the cut-out, mark components and confirm wheel ellipses and hubs. Automatic suggestions are starting points. Save an editable project before making substantial changes.

The prepared Raleigh sample is available from the welcome screen. The additional [champagne example](../public/sample/champagne.bike.json) opens through **Import portable project**. Its source image has already been isolated on white for privacy; it cannot restore the original surroundings.

## Style and replace

Select a component on the image or component strip. Unlock it if you intend to edit it. Colour and finish changes use the photograph's shading. Under **Visual styles**, choose generic styles or real product choices. Real-product identity and selected variant are saved independently of the visual approximation.

Open **Placement & overlap** to adjust scale, width, height, skew, rotation, offsets and layer ordering. Photographic cutouts also support brightness, contrast and warmth. Confirm wheel ellipses and hub positions in setup before fine adjustment. Use component/global protection and locked components to retain foreground frame tubes, brakes, seatposts and pedals.

Replacement images cannot recover hidden surfaces. Where a smaller crank or saddle exposes missing pixels, refine the mask or use a more suitable source photo. Check both wheel centres, fork crossings, saddle rails and pedal overlap at high zoom. The generated front-wheel style is also used for the rear wheel and does not depict its exact cassette/hub assembly.

## Catalogue and compatibility

**Catalogue** in the top navigation or **Catalogue & fit** beside Visual styles opens the catalogue. Real products have sourced facts; measurements are optional and belong here rather than the appearance workflow. Add values you actually know and mark them confirmed. Both the catalogue filter and **Compatible real parts** use the same checks.

The implemented fields include clamp and seatpost diameters, bead-seat diameter, tyre width versus recorded clearance, axle spacing/type, brake mount/pull/reach, cassette interface, drivetrain speeds, bottom-bracket thread/shell width, pedal thread and saddle-rail dimensions. Only recognized facts actually supplied for the selected product/variant are checked. Numeric requirements use the supported equality/range/clearance rules; text requirements use normalized matching. Missing bicycle values, provisional facts and conflicting facts cannot count as confirmed matches. An empty set of checks is not a confirmed match.

Passing these checks does not establish whole-bicycle compatibility. Chainline, coupled drivetrain behaviour, strength, clearance under load, routing and unlisted interfaces are outside the checks. Product data can become outdated. The visualization and filter should not be your sole basis for a purchase.

## Save, compare and export

Edits autosave in this browser's IndexedDB. Watch for **Saved locally**. **Save design** keeps a named variation; **Compare** lets you choose the original on white, the current design or a saved design on either side of the slider.

**Save editable project** downloads a `.bike.json` portable file containing the photo, masks, placements, designs and permitted selected assets. Keep your own backup: clearing browser storage or changing origin does not migrate projects. Reopen through **Import portable project**. Treat downloaded projects as private until you have reviewed their embedded images, names and measurements.

**Export PNG** creates a white, opaque image of the current design. It is an appearance preview. Neither PNG export nor project export uploads your bicycle to a service.
