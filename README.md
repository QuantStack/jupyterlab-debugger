# jupyterlab-debugger

Debugger extension for JupyterLab.

## Prerequisites

* JupyterLab 1.0

## Development

This extension is being developed using [this development branch](https://github.com/jupyterlab/jupyterlab/pull/6704) in the JupyterLab repo.

To get started:

```bash
# follow the JupyterLab contributing guide to create a local dev setup
# https://github.com/jupyterlab/jupyterlab/blob/master/CONTRIBUTING.md

# activate the conda environment
conda activate jupyterlab-dev-debugger

# checkout the debug branch
git fetch origin pull/6704/head:JohanMabille-debug
git checkout JohanMabille-debug

# create the ptvsd directory for the logs in the folder where JupyterLab is started
mkdir xpython_debug_logs

# install the debugger extension as a sibling package
jlpm run add:sibling /path/to/jupyterlab-debugger

# start JupyterLab in dev mode and with the kernel logs enabled
XEUS_LOG=1 jupyter lab --dev-mode --no-browser --watch
```

When making changes to the `jupyterlab-debugger` extension, rerun the `add:sibling` command.

