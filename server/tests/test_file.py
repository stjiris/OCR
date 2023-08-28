import json
import os
import pytest
import re

from src.utils.file import *
from celery_app import make_changes
from celery_app import task_file_ocr
from celery_app import task_page_ocr

@pytest.fixture
def fs(tmp_path):
    """ Create a fake test_filesystem """
    (tmp_path / "test_files").mkdir()

    for (root, dirs, test_files) in os.walk("./tests/test_files"):
        for dir in dirs:
            (tmp_path / root.replace("./tests/", "") / dir).mkdir()

        for file in test_files:
            original_f = root + "/" + file
            f = tmp_path / root.replace("./tests/", "") / file
            if original_f.endswith(".json"):
                with open(original_f, "r") as _f:
                    data = json.load(_f)
                with open(f, "w") as _f:
                    json.dump(data, _f, indent=2)
            else:
                with open(original_f, "rb") as _f:
                    data = _f.read()
                with open(f, "wb") as _f:
                    _f.write(data)

    yield tmp_path

class TestCurrentTime:
    """
    Class to test if the current time is returned with the correct format
    """

    def test_current_time_format(self):
        """ Test if the current time is returned with the correct format """
        assert re.match(r"\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}", get_current_time()) is not None

# class TestFileParsed:
#     """
#     Class to test the file_parsed function
#     """

#     def test_file_parsed(self, fs):
#         """ Test if the file_parsed function returns the correct value """
#         prepare_file_ocr(str(fs / "test_files/folder/sample.pdf"))
#         task_file_ocr(str(fs / "test_files/folder/sample.pdf"), ["por"], "tesseract", testing = True)

#         data = get_data(fs / "test_files/folder/sample.pdf/_data.json")
#         assert "exceptions" not in data.get("ocr", {})

class TestPageCount:
    """
    Test the get_page_count function
    """

    def test_page_count_pdf(self):
        """ Test if the page count of a pdf is returned correctly """
        assert get_page_count("tests/test_files/folder/sample.pdf/sample.pdf") == 2

    def test_page_count_jpg(self):
        """ Test if the page count of a jpg is returned correctly """
        assert get_page_count("tests/test_files/folder/sample.jpg/sample.jpg") == 1

class TestFileBasename:
    """
    Class to test the get_file_basename function
    """

    def test_simple_file_basename(self):
        """ Test with a simple file name """
        assert get_file_basename("test_file.pdf") == "test_file"

    def test_file_basename_with_path(self):
        """ Test with a file name with a path """
        assert get_file_basename("C:/test/test_file.pdf") == "test_file"

    def test_file_basename_with_multiple_dots(self):
        """ Test with a file name with multiple dots """
        assert get_file_basename("test.file.pdf") == "test.file"

    def test_file_basename_with_backslash(self):
        """ Test with a file name with backslash """
        assert get_file_basename("test\\test_file.pdf") == "test_file"

class TestFileExtension:
    """
    Class to test the get_file_extension function
    """

    def test_simple_file_extension(self):
        """ Test with a simple file name """
        assert get_file_extension("test_file.pdf") == "pdf"

    def test_file_extension_with_path(self):
        """ Test with a file name with a path """
        assert get_file_extension("C:/test/test_file.pdf") == "pdf"

    def test_file_extension_with_multiple_dots(self):
        """ Test with a file name with multiple dots """
        assert get_file_extension("test.file.pdf") == "pdf"

    def test_file_extension_with_jpg(self):
        """ Test with a jpg file """
        assert get_file_extension("test_file.jpg") == "jpg"

class TestGenerateUUID:
    """
    Class to test the generate_uuid function
    """

    def test_uuid_uniqueness(self):
        """ Test if the generated UUID is unique for different paths """
        assert generate_uuid("path/file1.pdf") != generate_uuid("path/file2.pdf")

    def test_uuid_constant(self):
        """ Test if the generated UUID is constant for the same path """
        assert generate_uuid("path/file1.pdf") == generate_uuid("path/file1.pdf")

class TestGetData:
    """
    Class to test the get_data function
    """
    
    def test_get_data(self, fs):
        """ Test if the data is returned correctly """
        data = get_data(fs / "test_files/folder/sample.pdf/_data.json")
        assert type(data) == dict
        assert data["type"] == "file"
        assert data["pages"] == 2

    def test_get_data_empty_file(self, fs):
        (fs / "test_files/folder/sample.test").mkdir()
        (fs / "test_files/folder/sample.test/_data.json").touch()
        data = get_data(fs / "test_files/folder/sample.test/_data.json")
        assert type(data) == dict
        assert data == {}

class TestUpdateData:
    """
    Class to test the update_data function
    """

    def test_update_data(self, fs):
        """ Test if the data is updated correctly """
        update_data(fs / "test_files/folder/sample.pdf/_data.json", {"test": "test"})
        data = get_data(fs / "test_files/folder/sample.pdf/_data.json")
        assert data["test"] == "test"

class TestPrepareFileOCR:
    """ 
    Class to test the prepare_file_ocr function
    """

    def test_prepare_file_ocr_pdf(self, fs):
        """ Test if the correct test_filesystem is created """
        prepare_file_ocr(str(fs / "test_files/folder/sample.pdf"))
        assert os.path.exists(str(fs / "test_files/folder/sample.pdf/sample_0.jpg"))
        assert os.path.exists(str(fs / "test_files/folder/sample.pdf/sample_1.jpg"))

    def test_prepare_file_ocr_jpg(self, fs):
        """ Test if the correct test_filesystem is created """
        prepare_file_ocr(str(fs / "test_files/folder/sample.jpg"))
        assert os.path.exists(str(fs / "test_files/folder/sample.jpg/sample.jpg"))

    def test_prepare_file_ocr_no_duplicates(self, fs):
        prepare_file_ocr(str(fs / "test_files/folder/sample.pdf"))
        prepare_file_ocr(str(fs / "test_files/folder/sample.pdf"))
        assert os.path.exists(str(fs / "test_files/folder/sample.pdf/sample_0.jpg"))
        assert os.path.exists(str(fs / "test_files/folder/sample.pdf/sample_1.jpg"))