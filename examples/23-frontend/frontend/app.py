import os

import requests
import streamlit as st

API_URL = os.environ["API_URL"]

st.title("My shop")

name = st.text_input("New product")
if st.button("Add") and name:
    requests.post(f"{API_URL}/products", params={"name": name})

st.subheader("Products")
for product in requests.get(f"{API_URL}/products").json():
    st.write("•", product)
