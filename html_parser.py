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

# Header
header = soup.find("header")
logo = header.find("a", {"data-testid": "logoButton"})
tabs = header.find_all("a", {"role": "tab"})
logout_button = header.find("button", string="Logout")

# Main Content
main_content = soup.find("div", {"class": "MuiGrid2-grid-xs-12"})
search_bar = main_content.find("input", {"id": "sccSearchBar"})
update_master_list_button = main_content.find("button", {"data-testid": "updateMasterList"})
create_collection_deck_button = main_content.find("button", {"data-testid": "openCreateNewFlowButton"})
add_scc_button = main_content.find("button", {"data-testid": "addSccButton"})
sccs_table = main_content.find("table", {"data-testid": "masterListTable"})

with open("application_map.md", "w") as f:
    f.write("- **VUE Dashboard** (`/`)\n")
    f.write("  - **Header**\n")
    f.write(f"    - **VUE Logo:** `{get_mui_component(logo)}`\n")
    f.write("    - **Navigation Links:**\n")
    for tab in tabs:
        f.write(f"      - **{tab.string}:** `{get_mui_component(tab)}`\n")
    f.write(f"    - **Logout Button:** `{get_mui_component(logout_button)}`\n")
    f.write("  - **Main Content Area**\n")
    f.write(f"    - **Search SCCs...:** `{get_mui_component(search_bar)}`\n")
    f.write(f"    - **\"Update Master List\" Button:** `{get_mui_component(update_master_list_button)}`\n")
    f.write(f"    - **\"Create Collection Deck\" Button:** `{get_mui_component(create_collection_deck_button)}`\n")
    f.write(f"    - **\"ADD SCC\" Button:** `{get_mui_component(add_scc_button)}`\n")
    f.write(f"    - **SCCs Table:** `{get_mui_component(sccs_table)}`\n")
