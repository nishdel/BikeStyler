"""Protected importer contract; runnable without app dependencies."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("catalogue_options", Path(__file__).resolve().parents[1] / "scripts/catalogue_options.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class VariantLabelTests(unittest.TestCase):
    def test_explicit_options_and_original_unchanged(self):
        v = {"name": "Blue / L", "options": {" Colour ": "  Blue\n", "Size": "L"}, "source_available": False}
        self.assertEqual(module.variant_label(v), "Colour: Blue · Size: L")
        self.assertEqual(v["options"][" Colour "], "  Blue\n")
        self.assertFalse(v["source_available"])

    def test_placeholder_and_missing(self):
        for v in [{}, {"name": "Default Title"}, {"name": "", "options": {"Title": "Default Title"}}, {"options": {"Colour": " ", "Size": None}}]:
            self.assertEqual(module.variant_label(v), "Standard")

    def test_fallback_and_literal_values(self):
        self.assertEqual(module.variant_label({"name": "  Steel\n silver  "}), "Steel silver")
        self.assertEqual(module.variant_label({"options": {"Offset": 0, "Diameter": "Ø 27.2 mm", "Title": "Default Title"}}), "Offset: 0 · Diameter: Ø 27.2 mm")


if __name__ == "__main__":
    unittest.main()
