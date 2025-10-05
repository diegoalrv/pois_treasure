#!/bin/bash

source ../backend/.venv/bin/activate
which python
python populate_pois.py
python populate_profiles.py
python populate_users.py