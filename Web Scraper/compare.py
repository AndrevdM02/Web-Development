import json
from deepdiff import DeepDiff

def load_json(file_path):
    """Load JSON data from a file."""
    with open(file_path, 'r') as file:
        return json.load(file)

def compare_json_files(file1, file2):
    """Compare two JSON files and return the differences."""
    json1 = load_json(file1)
    json2 = load_json(file2)

    diff = DeepDiff(json1, json2, ignore_order=True)
    return diff

def main():
    file1 = 'question_ids_answers.json'
    file2 = 'api.json'

    differences = compare_json_files(file1, file2)

    if differences:
        print("Differences found:")
        print(differences)
    else:
        print("The JSON files are identical.")

if __name__ == "__main__":
    main()