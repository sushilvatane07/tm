from cryptography.fernet import Fernet
import os


def encrypt_file(file_path):
    """
    Encrypt a file with a new unique key.

    Args:
        file_path (str): Path of the file to encrypt.

    Returns:
        tuple:
            encrypted_file_path (str)
            key (bytes)
    """

    key = Fernet.generate_key()
    fernet = Fernet(key)

    # Read original file
    with open(file_path, "rb") as file:
        data = file.read()

    # Encrypt
    encrypted_data = fernet.encrypt(data)

    # Create encrypted folder
    os.makedirs("encrypted", exist_ok=True)

    # Save encrypted file
    encrypted_file_path = os.path.join(
        "encrypted",
        os.path.basename(file_path) + ".enc"
    )

    with open(encrypted_file_path, "wb") as file:
        file.write(encrypted_data)

    print("✅ File encrypted successfully.")

    # Return encrypted file path and key
    return encrypted_file_path, key


def decrypt_file(encrypted_file_path, key):
    """
    Decrypt an encrypted file.

    Args:
        encrypted_file_path (str): Path of encrypted file.
        key (bytes): Key returned from encrypt_file().

    Returns:
        str: Path of decrypted file.
    """

    fernet = Fernet(key)

    # Read encrypted file
    with open(encrypted_file_path, "rb") as file:
        encrypted_data = file.read()

    # Decrypt
    decrypted_data = fernet.decrypt(encrypted_data)

    # Create decrypted folder
    os.makedirs("decrypted", exist_ok=True)

    filename = os.path.basename(encrypted_file_path).replace(".enc", "")

    decrypted_file_path = os.path.join(
        "decrypted",
        filename
    )

    with open(decrypted_file_path, "wb") as file:
        file.write(decrypted_data)

    print("✅ File decrypted successfully.")

    return decrypted_file_path


def decrypt_bytes(encrypted_data: bytes, key: bytes) -> bytes:
    """
    Decrypt encrypted bytes in memory.

    Args:
        encrypted_data (bytes): Encrypted binary data.
        key (bytes): Fernet key.

    Returns:
        bytes: Decrypted binary data.
    """
    if isinstance(key, str):
        key = key.encode()
    fernet = Fernet(key)
    return fernet.decrypt(encrypted_data)


if __name__ == "__main__":
    test_file = "sample.txt"
    if os.path.exists(test_file):
        encrypted_path, key = encrypt_file(test_file)
        print("Encrypted File:", encrypted_path)
        print("Encryption Key:", key.decode())

        decrypted_path = decrypt_file(encrypted_path, key)
        print("Decrypted File:", decrypted_path)