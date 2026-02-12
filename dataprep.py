import pandas as pd
import ast

# ---- Config ----
INPUT_CSV = "E:\TimeArcs-master\TimeArcs-master\TTUPublication\\all.csv"
OUTPUT_TSV = "E:\TimeArcs-master\TimeArcs-master\TTUPublication\\grants_final.tsv"

# ---- Load CSV ----
df = pd.read_csv(INPUT_CSV, encoding="cp1252")

# ---- Column names ----
col_proposal = "proposal_no"
col_date = "date_submitted"
col_title = "title"
col_researcher = "PI"
col_theme = "theme"

df[col_date] = pd.to_datetime(df[col_date], errors="coerce", infer_datetime_format=True)
df["Year"] = df[col_date].dt.year

#Clean strings
for c in [col_proposal, col_title, col_researcher, col_theme]:
    df[c] = df[c].astype("string").str.strip()
    df[col_title] = df[col_title].str.replace('"', "'")

df = df.dropna(subset=[col_title, "Year"])

# Normalize researcher names: "Last, First" → "First Last"
def normalize_name(name: str) -> str:
    if "," in name:
        last, first = name.split(",", 1)
        return f"{first.strip()} {last.strip()}"
    return name.strip()

df[col_researcher] = df[col_researcher].apply(
    lambda x: normalize_name(x) if pd.notna(x) else x
)

def to_py_list_string(series: pd.Series) -> str:
    clean = [x for x in series.dropna().astype(str)
             if x.strip() and x.strip().lower() != "nan"]
    seen = set()
    uniq = []
    for x in clean:
        if x not in seen:
            seen.add(x)
            uniq.append(x)
    return '"' + ",".join(uniq) + '"'

#Group by Title + Year
out = (
    df.groupby([col_title, "Year"], as_index=False)
      .agg(
          ProposalNo=(col_proposal, to_py_list_string),
          Researchers=(col_researcher, to_py_list_string),
          Theme=(col_theme, to_py_list_string),
      )
      .rename(columns={col_title: "Title"})
      [["ProposalNo", "Title", "Year", "Researchers", "Theme"]]
)

#Filter: more than 1 author
def count_authors(list_str: str) -> int:
    try:
        return len(",".join(ast.literal_eval(f"[{list_str}]")).split(","))
    except Exception:
        return 0

out = out[out["Researchers"].apply(count_authors) > 1]

out = pd.DataFrame({
    "Code": out["ProposalNo"],
    "Time": out["Year"],
    "Theme": out["Theme"],
    "Title": out["Title"],
    "Authors": out["Researchers"],
})

# ---- Save TSV ----
out.to_csv(OUTPUT_TSV, sep="\t", index=False)
print(f"Saved {len(out)} rows to {OUTPUT_TSV}")

# df = pd.read_csv("E:\TimeArcs-master\TimeArcs-master\TTUPublication\\grants_final.tsv", sep="\t")

# Collect all themes
# themes = set()

# for s in df["Theme"].dropna():
#     try:
#         theme_list = ast.literal_eval(s)
#         themes.add(theme_list)
#         # print(themes)
#     except Exception:
#         pass

# # Print results (sorted for readability)
# print("All themes:")
# for t in sorted(themes):
#     print("-", t)

with open(OUTPUT_TSV, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('"""', '"')
with open(OUTPUT_TSV, 'w', encoding='utf-8') as f:
    f.write(content)