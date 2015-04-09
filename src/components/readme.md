#### Epicenter JS Libs Components

In addition to the epicenter.js library itself, the Epicenter JS Libs project also includes reusable components. These HTML, CSS, and JS files are templates you can use to perform common actions. They can be copied directly to your project, often without modification.

* **Login Component**: Provides a login form for team members and end users of your project. Includes a group selector for end users that are members of multiple groups.
	* `index.html`: The login form.
	* `login.css`: Provides styling for the group selector pop over dialog.
	* `login.js`: Uses the [Authorization Manager](http://forio.com/epicenter/docs/public/api_adapters/generated/auth-manager/) to log in users.
