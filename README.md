# jupyterlab-debugger

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/QuantStack/jupyterlab-debugger/master?urlpath=/lab)

Debugger extension for JupyterLab.

## Prerequisites

- JupyterLab 1.1+

## Development

To get started:

```bash
# create a new conda environment
conda create -n jupyterlab-debugger -c conda-forge nodejs xeus-python ptvsd

# activate the conda environment
conda activate jupyterlab-debugger

# install JupyterLab 1.1 alpha
python -m pip install --pre jupyterlab

# create the ptvsd directory for the logs in the folder where JupyterLab is started
mkdir xpython_debug_logs

# install dependencies
jlpm

# build Typescript source
jlpm build

# install the development version of the extension
jupyter labextension install .

# start JupyterLab with the kernel logs enabled
XEUS_LOG=1 jupyter lab --no-browser --watch
```
