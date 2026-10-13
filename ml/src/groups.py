GROUPS = {
    "base": ["Age", "Weight", "Length", "Sex", "BMI", "DM", "HTN", "Current Smoker", "EX-Smoker", "FH",
             "Obesity", "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP", "BP", "PR", "Edema",
             "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur", "Diastolic Murmur",
             "Typical Chest Pain", "Dyspnea", "Function Class", "Atypical", "Nonanginal", "LowTH Ang"],
    "ecg": ["Q Wave", "St Elevation", "St Depression", "Tinversion", "LVH", "Poor R Progression", "BBB"],
    "labs": ["FBS", "CR", "TG", "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC", "Lymph", "Neut", "PLT"],
    "echo": ["EF-TTE", "Region RWMA", "VHD"],
}
GROUP_OF = {col: g for g, cols in GROUPS.items() for col in cols}
OPTIONAL_GROUPS = ["ecg", "labs", "echo"]


def columns_for(groups, all_columns):
    keep = {"base", *groups}
    return [c for c in all_columns if GROUP_OF[c] in keep]