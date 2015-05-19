#### Epicenter JS Libs Components

In addition to the epicenter.js library itself, the Epicenter JS Libs project also includes reusable components. These HTML, CSS, and JS files are templates you can use to perform common actions. They can be copied directly to your project, often without modification.

**Login Component**

Provides a login form for team members and end users of your project. Includes a group selector for end users that are members of multiple groups.

* `index.html`: The login form.
* `login.css`: Provides styling for the group selector pop over dialog.
* `login.js`: Uses the [Authorization Manager](./generated/auth-manager/) to log in users.


**Assignment Component**

Provides an interface to automatically assign  end users to [worlds](../glossary/#world), for multiplayer projects. Includes the ability to set the number of end users per world, assign and unassign end users, and mark certain end users as inactive (e.g. if they are not present on the day the simulation game play is occurring). These features are all available within the Epicenter interface (see [Multiplayer Settings](../updating_your_settings/#multiplayer) and [Multiplayer Assignment](../groups_and_end_users/#multiplayer-assignment)); this component allows you to easily add them to your project. For example, this way a facilitator could make the end user assignments to worlds in your project's user interface, without needing to log in to Epicenter directly.

* `index.html`: The form for automatic end user assignment to worlds.
* `assignment.css`: Styles and icons used in the form.
* `js/`: Uses the [World API Adapter](./generated/world-api-adapter/) while assigning end users to worlds. 
* `templates/`: HTML for creating rows (read-only and editable) for the assigned users.