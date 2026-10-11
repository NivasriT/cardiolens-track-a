from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW_FILE = ROOT / "data" / "raw" / "z_alizadeh_sani_extended.xlsx"

TARGET_COLUMNS = ["Cath", "LAD", "LCX", "RCA"]
DROP_COLUMNS = ["Exertional CP"]          # only ever "N" -> carries no information

YN = {"N": 0, "Y": 1}
SEX = {"Fmale": 0, "Male": 1}              # "Fmale" is how the dataset spells Female
BBB = {"N": 0, "LBBB": 1, "RBBB": 2}
VHD = {"N": 0, "mild": 1, "Moderate": 2, "Severe": 3}


def load_raw() -> pd.DataFrame:
    return pd.read_excel(RAW_FILE, sheet_name=0)


def encode(df: pd.DataFrame) -> pd.DataFrame:
    """Turn every text input column into numbers. Targets are left as text."""
    df = df.copy()
    df = df.drop(columns=[c for c in DROP_COLUMNS if c in df.columns])
    for col in df.columns:
        if col in TARGET_COLUMNS or pd.api.types.is_numeric_dtype(df[col]):
            continue
        if col == "Sex":
            df[col] = df[col].map(SEX)
        elif col == "BBB":
            df[col] = df[col].map(BBB)
        elif col == "VHD":
            df[col] = df[col].map(VHD)
        else:
            df[col] = df[col].map(YN)
        assert df[col].notna().all(), f"Unmapped value in column {col}"
    return df


def make_targets(df: pd.DataFrame) -> dict:
    return {
        "CAD": (df["Cath"] == "CAD").astype(int),
        "LAD": (df["LAD"] == "Stenotic").astype(int),
        "LCX": (df["LCX"] == "Stenotic").astype(int),
        "RCA": (df["RCA"] == "Stenotic").astype(int),
    }


def make_features(df: pd.DataFrame) -> pd.DataFrame:
    X = df.drop(columns=[c for c in TARGET_COLUMNS if c in df.columns])
    assert not set(TARGET_COLUMNS) & set(X.columns), "LEAKAGE: target column in inputs"
    return X


def load_all():
    df = encode(load_raw())
    return make_features(df), make_targets(df)


if __name__ == "__main__":
    X, Y = load_all()
    print("inputs:", X.shape)
    print("any text columns left:", [c for c in X.columns if not pd.api.types.is_numeric_dtype(X[c])])
    for t, y in Y.items():
        print(t, "positives:", int(y.sum()), "of", len(y))