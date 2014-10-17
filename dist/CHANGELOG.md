<a name="1.1.2"></a>
### 1.1.2 (2014-10-17)

Bug-fixes to the run manager

<a name="1.1.1"></a>
### 1.1.1 (2014-10-02)

Bug-fix to prevent passing in run-ids while creating a run

<a name="1.1.0"></a>
## 1.1.0 (2014-09-29)

- Epicenter.js now includes the Run Manager and the Scenario Manager (documentation pending)

<a name="1.0.2"></a>
## 1.0.2 (2014-09-22)
- Build process generates `epicenter.js` (un-minified concatenated file) in addition to `epicenter.min.js`
- Fixed bug where transport option for `complete` was not being passed through on Run API Service
- You can now set default transport options for Run Service and over-ride on a per-call level. For e.g.,

```javascript
var originalComplete = sinon.spy();
var complete = sinon.spy();
var rs = new RunService({account: 'forio', project: 'js-libs', transport: {complete: originalComplete}});
rs.create('model.jl', {complete: complete});

originalComplete.should.not.have.been.called;
complete.should.have.been.called;
```


<a name="1.0.1"></a>
## 1.0.1 (2014-09-09)

Changed the default token to `epicenter.project.token` from `epicenter.token`. This is to prevent conflicts for users who're logged into Epicenter through the manager. Use cases:

User logged into Epicenter, but not into project:
 - `epicenter.token` is set by Manager and passed along to all the APIs

 User logged into Epicenter, and also into project:
 - `epicenter.project.token` is also sent as an Authorization header, which overrides `epicenter.token`. In other words, project privileges override default epicenter privileges

 User not logged into Epicenter, but logged into project:
 - Authorization header is sent and respected
