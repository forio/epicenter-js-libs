<a name="1.0.1"></a>
## 1.0.1 (2014-09-09)

Changed the default token to `epicenter.project.token` from `epicenter.token`. This is to prevent conflicts for users who're logged into Epicenter through the manager. Use cases:

User logged into Epicenter, but not into project:
 - `epicenter.token` is set by Manager and passed along to all the APIs

 User logged into Epicenter, and also into project:
 - `epicenter.project.token` is also sent as an Authorization header, which overrides `epicenter.token`. In other words, project privileges override default epicenter privileges

 User not logged into Epicenter, but logged into project:
 - Authorization header is sent and respected
