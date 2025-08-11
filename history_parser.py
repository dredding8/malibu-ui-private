from bs4 import BeautifulSoup
import re

def get_mui_component(tag):
    if not tag:
        return "Unknown"
    classes = tag.get("class", [])
    for cls in classes:
        if cls.startswith("Mui"):
            return cls.split("-")[0]
    return "Unknown"

with open("page.html", "r") as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, "html.parser")

# History Page
start_date_textbox = soup.find("input", {"data-testid": "start-date"})
end_date_textbox = soup.find("input", {"data-testid": "end-date"})
reset_button = soup.find("button", {"data-testid": "reset"})
ready_to_continue_table = soup.find("h6", string="Ready to Continue").find_next("table")
completed_decks_table = soup.find("h6", string="Completed Decks").find_next("table")

with open("application_map.md", "a") as f:
    f.write("  - **History Page** (`/history`)\n")
    f.write(f"    - **Start Date Textbox:** `{get_mui_component(start_date_textbox)}`\n")
    f.write(f"    - **End Date Textbox:** `{get_mui_component(end_date_textbox)}`\n")
    f.write(f"    - **Reset Button:** `{get_mui_component(reset_button)}`\n")
    f.write(f"    - **Ready to Continue Table:** `{get_mui_component(ready_to_continue_table)}`\n")
    f.write(f"    - **Completed Decks Table:** `{get_mui_component(completed_decks_table)}`\n")
