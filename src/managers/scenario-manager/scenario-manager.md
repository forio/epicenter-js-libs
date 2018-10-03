## Scenario Manager

In some projects, often called "turn-by-turn" projects, end users advance through the project's model step-by-step, working either individually or together to make decisions at each step. 

In other projects, often called "run comparison" or "scenario comparison" projects, end users set some initial decisions, then simulate the model to its end. Typically end users will do this several times, creating several runs, and compare the results. 

The Scenario Manager makes it easy to create these "run comparison" projects. Each Scenario Manager allows you to compare the results of several runs. This is mostly useful for time-based models; by default, you can use the Scenario Manager with [Vensim](../../../model_code/vensim/), [Powersim](../../../model_code/powersim/), and [SimLang](../../../model_code/forio_simlang). (You can use the Scenario Manager with other languages as well, by using the Scenario Manager's [configuration options](#configuration-options) to change the `advanceOperation`.)

The Scenario Manager can be thought of as a collection of [Run Managers](../run-manager/) with pre-configured [strategies](../strategies/). Just as the Run Manager provides use case -based abstractions and utilities for managing the [Run Service](../run-api-service/), the Scenario Manager does the same for the Run Manager.

There are typically three components to building a run comparison:

* A `current` run in which to make decisions; this is defined as a run that hasn't been advanced yet, and so can be used to set initial decisions. The current run maintains state across different sessions.
* A list of `saved` runs, that is, all runs that you want to use for comparisons.
* A `baseline` run to compare against; this is defined as a run "advanced to the end" of your model using just the model defaults. Comparing against a baseline run is optional; you can [configure](#configuration-options) the Scenario Manager to not include one.

To satisfy these needs a Scenario Manager instance has three Run Managers: [baseline](./baseline/), [current](./current/), and [savedRuns](./saved/).

### Using the Scenario Manager to create a run comparison project

To use the Scenario Manager, instantiate it, then access its Run Managers as needed to create your project's user interface:

```js
var sm = new F.manager.ScenarioManager({
run: {
    model: 'mymodel.vmf'
}});

// The current is an instance of a Run Manager,with a strategy which picks up the most recent unsaved run.
// It is typically used to store the decisions being made by the end user. 
var currentRM = sm.current;

// The Run Manager operation, which retrieves the current run.
currentRM.getRun();
// The Run Manager operation, which resets the decisions made on the current run.
currentRM.reset();
// A special method on the current run, which clones the current run, then advances and saves this clone (it becomes part of the saved runs list).
// The current run is unchanged and can continue to be used to store decisions being made by the end user.
currentRM.saveAndAdvance();

// The savedRuns is an instance of a Saved Runs Manager (itself a variant of a Run Manager). It is typically displayed in the project's UI as part of a run comparison table or chart.
var savedRM = sm.savedRuns;
// Mark a run as saved, adding it to the set of saved runs.
sm.savedRuns.save(run);
// Mark a run as removed, removing it from the set of saved runs.
sm.savedRuns.remove(run);
// List the saved runs, optionally including some specific model variables for each.
sm.savedRuns.getRuns();

// The baseline is an instance of a Run Manager, with a strategy which locates the most recent baseline run (that is, flagged as `saved` and not `trashed`), or creates a new one. It is typically displayed in the project's UI as part of a run comparison table or chart.
var baselineRM = sm.baseline;

// The Run Manager operation, which retrieves the baseline run.
sm.baseline.getRun();
// The Run Manager operation, which resets the baseline run. Useful if the model has changed since the baseline run was created.
sm.baseline.reset(); 
```