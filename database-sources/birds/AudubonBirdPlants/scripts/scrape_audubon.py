"""
Scrape Audubon Native Plants database via Selenium.
Uses Chrome to render the JavaScript-heavy pages.

Usage: python scrape_audubon.py [zip_code]
Default: 97501 (Medford, OR)
"""

import csv, json, os, re, sys, time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)


def scrape_zip(driver, zipcode, max_pages=50):
    """Scrape all pages for a given zip code."""
    plants = []
    
    for page in range(max_pages):
        url = f"https://www.audubon.org/native-plants/best-results?zipcode={zipcode}&go_to_page=,{page}"
        driver.get(url)
        time.sleep(4)  # Wait for JS rendering
        
        text = driver.find_element(By.TAG_NAME, "body").text
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        page_plants = []
        for i, line in enumerate(lines):
            if re.match(r'^[A-Z][a-z]+ [a-z]+', line):
                sci = line
                skip_words = ['Plant name','Search by','Native plants','Full results',
                             'Best results','Local resources','Visit site','Celebrate',
                             'Share your','Download the','Audubon experts','Your local',
                             'Skip to','Be part','May attract','Close modal','Plants and',
                             'Trees online','Buy online','Next page','Previous page',
                             'Get my','Notice of','Sign up','By submitting','This site',
                             'Get the','Join our','Phone optional']
                if any(sci.lower().startswith(s.lower()) for s in skip_words):
                    continue
                common = ''
                if i > 0 and lines[i-1][0].isupper() and len(lines[i-1]) < 50:
                    if lines[i-1] not in ['MORE','LOCAL RESOURCES','NATIVE PLANTS DATABASE','Filter',
                                          'ANNUALS/PER.','SHRUBS','TREES','EVERGREEN','GRASSES','VINES']:
                        common = lines[i-1]
                page_plants.append({
                    'scientific_name': sci,
                    'common_name': common,
                    'zipcode': zipcode,
                })
        
        if not page_plants:
            print(f"  Page {page}: no plants found - end of results")
            break
        
        plants.extend(page_plants)
        print(f"  Page {page}: {len(page_plants)} plants (total: {len(plants)})")
    
    return plants


def main():
    zipcode = sys.argv[1] if len(sys.argv) > 1 else '97501'
    
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        print(f"Scraping Audubon for zip {zipcode}...")
        plants = scrape_zip(driver, zipcode)
        print(f"\nTotal plants: {len(plants)}")
        
        # Deduplicate
        seen = set()
        unique = []
        for p in plants:
            if p['scientific_name'] not in seen:
                seen.add(p['scientific_name'])
                unique.append(p)
        print(f"Unique: {len(unique)}")
        
        # Write
        csv_path = os.path.join(DATA_DIR, f"plants_{zipcode}.csv")
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=['scientific_name', 'common_name', 'zipcode'])
            w.writeheader()
            for p in unique:
                w.writerow(p)
        print(f"Wrote {csv_path}")
        
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
