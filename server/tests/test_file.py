import re

from PIL.Image import Image

from src.utils.file import *

class TestCurrentTime:
    """
    Class to test if the current time is returned with the correct format
    """

    def test_current_time_format(self):
        """ Test if the current time is returned with the correct format """
        assert re.match(r"\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}", get_current_time()) is not None

class TestPageCount:
    """
    Test the get_page_count function
    """

    def test_page_count_pdf(self):
        """ Test if the page count of a pdf is returned correctly """
        assert get_page_count("tests/test_files/sample.pdf") == 2

    def test_page_count_jpg(self):
        """ Test if the page count of a jpg is returned correctly """
        assert get_page_count("tests/test_files/sample.jpg") == 1

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