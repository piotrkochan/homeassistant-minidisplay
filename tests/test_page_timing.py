"""Regression checks for all non-animated page-switch exits."""
from pathlib import Path
import re
import subprocess
import tempfile
import unittest


class PageTimingTests(unittest.TestCase):
    def test_all_fallbacks_use_the_same_dwell_reset(self):
        source = (Path(__file__).parents[1] / "firmware/src/main.cpp").read_text()
        function = source.split("void showPageWithTransition(uint8_t nextPageIndex) {", 1)[1]
        function = function.split("\nbool loadDashboardMetadata", 1)[0]
        match = re.search(r"const auto showWithoutTransition = \[&\]\(\) \{(.*?)\n  \};", function, re.S)
        self.assertIsNotNone(match)
        self.assertEqual(function.count("showWithoutTransition();"), 5)
        self.assertNotIn("showCurrentPage();", function.replace(match.group(0), ""))
        # Execute the actual firmware fallback, with a slow mock renderer.
        program = """
        #include <cassert>
        #include <cstdint>
        uint32_t tick = 9000, pageShownAt = 0;
        unsigned activePageIndex = 0, nextPageIndex = 1;
        uint32_t millis() { return tick; }
        void showCurrentPage() { tick += 200; }
        int main() {
        """ + match.group(0) + """
          for (unsigned i = 0; i < 5; ++i) {
            showWithoutTransition();
            assert(activePageIndex == nextPageIndex);
            assert(pageShownAt == tick);
            assert(uint32_t(millis() - pageShownAt) < 3000);
            tick += 3000;
          }
          tick = UINT32_MAX - 100;
          showWithoutTransition();
          assert(uint32_t(millis() - pageShownAt) == 0);
        }
        """
        with tempfile.TemporaryDirectory() as directory:
            binary = str(Path(directory) / "page-timing")
            subprocess.run(["g++", "-x", "c++", "-std=c++17", "-Wall", "-Werror", "-o", binary, "-"],
                           input=program, text=True, check=True)
            subprocess.run([binary], check=True)


if __name__ == "__main__":
    unittest.main()
