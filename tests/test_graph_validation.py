"""Graph count is constrained by device memory, not an arbitrary HA count."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    "graphs", Path(__file__).parents[1] / "custom_components/mini_display/graphs.py")
graphs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(graphs)

class GraphValidationTest(unittest.TestCase):
    def test_many_distinct_series(self):
        document = {"pages": [{"rows": [{"cards": [
            {"type": "chart", "source": f"sensor.test{i}",
             "graph": {"points": 15, "intervalSeconds": 120}}
            for i in range(12)]}]}]}
        graphs.validate_graphs(document, ValueError)
        document["pages"][0]["rows"][0]["cards"][0]["graph"]["points"] = 121
        with self.assertRaises(ValueError):
            graphs.validate_graphs(document, ValueError)

if __name__ == "__main__":
    unittest.main()
