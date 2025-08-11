
This document provides the rationale for the changes made to the VUE application's information architecture and user flows, as detailed in `revised_application_map.md`.

### 1. Separation of Core Tasks

- **Change**: The original tab-based navigation (`Master`, `History`, `Analytics`) has been replaced with a task-oriented structure: `Dashboard`, `SCCs`, `Collection Decks`, and `Analytics`.
- **Rationale**: The `Master` tab was overloaded, serving as both a display for the SCC list and the entry point for creating collection decks and adding SCCs. By creating dedicated sections for `SCCs` and `Collection Decks`, we provide a clearer, more intuitive navigation structure. This aligns with the principle of **clarity and simplicity**, as users can now go to a specific place to perform a specific task.

### 2. Dedicated Page for "Add SCC"

- **Change**: The "Add SCC" functionality has been moved from a dialog box on the main page to a dedicated page (`/sccs/new`).
- **Rationale**: The original dialog had multiple, potentially confusing calls to action ("ADD SCC" vs. "Add to Master List"). By moving this to a separate page, we follow the **one thing per page** principle. This simplifies the form, reduces confusion, and makes the user's goal—adding a new SCC—the sole focus of the page. The button actions are now a clear and standard "Save" and "Cancel."

### 3. Unified "Collection Decks" Section

- **Change**: The `History` tab and the `Create Collection Deck` button have been consolidated into a single `Collection Decks` section.
- **Rationale**: Creating a new collection deck is intrinsically linked to viewing past ones. This change groups related tasks together, improving the **user-centric flow**. Users now have a single destination for all activities related to collection decks, whether it's starting a new one or reviewing an old one.

### 4. Multi-Page Flow for "Create Collection Deck"

- **Change**: The stepper for creating a collection deck has been broken out into a multi-page flow.
- **Rationale**: The original design placed a complex, multi-step process onto a single page. This can be overwhelming for users. By breaking the process into four distinct pages, we adhere to the **one thing per page** principle. This makes the task feel more manageable, reduces cognitive load, and allows the user to focus on a single set of related inputs at each stage. The flow is more transparent and easier to navigate with clear "Next" and "Back" buttons.

### 5. Improved Naming and Consistency

- **Change**: Renamed "Update Master List" to "Refresh List" and clarified button labels throughout the application.
- **Rationale**: Using consistent and clear language reduces ambiguity. "Refresh List" is a more common and instantly recognizable term for fetching new data. This focus on **consistency** helps users understand the application's behavior more quickly.

### 6. Streamlined Dashboard

- **Change**: The `Dashboard` is now a high-level overview with key metrics and quick links.
- **Rationale**: A good dashboard should provide at-a-glance information and act as a launchpad for common tasks. By surfacing key analytics and providing direct links to create SCCs and Collection Decks, the dashboard becomes more functional and user-centric.

By implementing these changes, the revised information architecture provides a more logical and intuitive user experience. The application is now structured around user tasks, complex processes are broken down into manageable steps, and the overall design is cleaner and more consistent.
