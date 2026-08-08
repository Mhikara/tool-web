#!/usr/bin/env python3
import requests
import csv

query = "web scraping"
max_hasil = 15
output_file = "hasil_github.csv"

print(f"[+] Mencari repo GitHub: {query}")

url = "https://api.github.com/search/repositories"
params = {"q": query, "sort": "stars", "order": "desc", "per_page": max_hasil}
headers = {"User-Agent": "Termux-Scraper", "Accept": "application/vnd.github.v3+json"}

try:
    r = requests.get(url, params=params, headers=headers, timeout=20)
    r.raise_for_status()
    data = r.json()

    hasil = []
    for repo in data.get("items", []):
        hasil.append([
            repo["full_name"],
            repo["html_url"],
            repo["stargazers_count"],
            repo.get("language") or "-",
            (repo.get("description") or "-")[:80]
        ])

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Nama Repo", "URL", "Stars", "Bahasa", "Deskripsi"])
        writer.writerows(hasil)

    print(f"\n[✓] Berhasil! Total: {len(hasil)} repo")
    print(f"[✓] Disimpan di: {output_file}\n")

    for item in hasil[:5]:
        print(f"★ {item[2]} | {item[0]}")
        print(f"  {item[1]}\n")

except Exception as e:
    print(f"[!] Error: {e}")
