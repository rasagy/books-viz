import pandas as pd
import numpy as np
import json
import lzma
import os

# Define the input and output file names
INPUT_FILE_XZ = 'GoodReads_100k_books.csv.xz'
OUTPUT_JSON = 'scatter_data.json'

def preprocess_data():
    """
    Reads, preprocesses, and samples book data, then saves it to a JSON file.
    """
    try:
        # Read the xz compressed CSV file
        # Using lzma directly to decompress and then pandas to read the CSV content
        with lzma.open(INPUT_FILE_XZ, 'rt', encoding='utf-8') as f:
            df = pd.read_csv(f)
    except FileNotFoundError:
        print(f"Error: The file {INPUT_FILE_XZ} was not found.")
        return
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return

    # Select and rename columns
    df = df[['pages', 'desc', 'reviews', 'rating']].copy()
    df.rename(columns={'pages': 'pages_val', 'desc': 'blurb_len', 'reviews': 'reviews_val', 'rating': 'rating_val'}, inplace=True)

    # Convert columns to numeric, coercing errors
    df['pages_val'] = pd.to_numeric(df['pages_val'], errors='coerce')
    df['blurb_len'] = df['blurb_len'].astype(str).map(len) # Calculate blurb length
    df['reviews_val'] = pd.to_numeric(df['reviews_val'], errors='coerce')
    df['rating_val'] = pd.to_numeric(df['rating_val'], errors='coerce')

    # Drop rows with NaN values that resulted from coercion or were already present
    df.dropna(subset=['pages_val', 'blurb_len', 'reviews_val', 'rating_val'], inplace=True)

    # Outlier clipping function
    def clip_outliers(series):
        lower_percentile = 0.5
        upper_percentile = 99.5
        lower_bound = series.quantile(lower_percentile / 100.0)
        upper_bound = series.quantile(upper_percentile / 100.0)
        return series.clip(lower=lower_bound, upper=upper_bound)

    # Apply outlier clipping
    # Ensure columns are float for quantile calculation if they are not already
    df['pages_val'] = df['pages_val'].astype(float)
    df['blurb_len'] = df['blurb_len'].astype(float) # Blurb length is numeric
    df['reviews_val'] = df['reviews_val'].astype(float)
    df['rating_val'] = df['rating_val'].astype(float)

    # Apply clipping only if there's data
    if not df.empty:
        for col in ['pages_val', 'blurb_len', 'reviews_val', 'rating_val']:
            df[col] = clip_outliers(df[col])

        # Drop rows that might have become NaN again if clipping resulted in issues (e.g. all values identical)
        # Although clip shouldn't introduce NaNs with valid bounds.
        df.dropna(subset=['pages_val', 'blurb_len', 'reviews_val', 'rating_val'], inplace=True)

    # Random sampling
    if len(df) > 5000:
        df = df.sample(n=5000, random_state=42)

    # Prepare data for JSON output
    output_data = []
    for _, row in df.iterrows():
        output_data.append({
            'pages': row['pages_val'],
            'blurb': row['blurb_len'],
            'reviews': row['reviews_val'],
            'rating': row['rating_val']
        })

    # Dump to JSON
    with open(OUTPUT_JSON, 'w') as f:
        json.dump(output_data, f)

    # Print final byte size
    file_size = os.path.getsize(OUTPUT_JSON)
    print(f"Successfully created {OUTPUT_JSON}")
    print(f"Final file size: {file_size} bytes")

    if file_size > 2 * 1024 * 1024:
        print(f"Warning: File size ({file_size} bytes) exceeds 2MB limit.")

if __name__ == '__main__':
    preprocess_data()
