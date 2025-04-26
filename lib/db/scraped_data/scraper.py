from random import randint
from matplotlib.font_manager import json_dump
import requests
from bs4 import BeautifulSoup
import json
import pandas as pd
import time

def fetch_product_inventory(url):
    """
    Fetches the seating‑chart payload (productInventory) from a TodayTix seating‑plan page.
    """
    resp = requests.get(url)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # The Next.js server‑props JSON is embedded in this script tag
    script = soup.find("script", id="__NEXT_DATA__", type="application/json")
    if not script:
        raise ValueError("Could not find __NEXT_DATA__ script tag")

    data = json.loads(script.string)
    # Navigate into the Next.js props to find productInventory
    inventory = data["props"]["pageProps"]["initialState"]["productInventory"]
    return inventory

if __name__ == "__main__":
    # List all the seating‑plan URLs you want to scrape
    urls = pd.read_csv('./theater_data.csv')

    for i, row  in urls.iterrows():
        try:
            inventory = fetch_product_inventory(row['url'])
            print(f"Inventory for {row['theater']}:\n")
            with open(f"{row['theater']}.json", 'w') as f:
                json.dump(inventory,f,indent=2)
            print("\n" + "="*80 + "\n")
        except Exception as e:
            print(f"Error fetching {row['theater']} @ {row['url']}: {e}")

        time.sleep(6)

        