package com.runbuncalc.app.updates;

import static com.runbuncalc.app.updates.UpdateManifest.require;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

final class UpdateFiles {
    static final long MAX_EXPANDED_BYTES = 256L * 1024 * 1024;
    static final int MAX_ENTRIES = 20000;

    static void verifyArchive(File archive, UpdateManifest manifest) throws IOException {
        require(archive.length() == manifest.size, "Update archive size does not match.");
        try (InputStream input = new FileInputStream(archive)) {
            MessageDigest hash = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[16384];
            int count;
            while ((count = input.read(buffer)) != -1) hash.update(buffer, 0, count);
            require(HexFormat.of().formatHex(hash.digest()).equals(manifest.sha256),
                "Update archive checksum does not match.");
        } catch (NoSuchAlgorithmException error) {
            throw new IOException("SHA-256 is unavailable.", error);
        }
    }

    static void extract(File archive, File destination) throws IOException {
        require(!destination.exists() && destination.mkdirs(), "Cannot create update staging directory.");
        long expanded = 0;
        int entries = 0;
        Set<String> names = new HashSet<>();
        try (ZipInputStream zip = new ZipInputStream(new FileInputStream(archive))) {
            ZipEntry entry;
            byte[] buffer = new byte[16384];
            while ((entry = zip.getNextEntry()) != null) {
                require(++entries <= MAX_ENTRIES, "Update archive has too many files.");
                String name = entry.getName();
                require(!name.isEmpty() && !name.startsWith("/") && !name.contains("\\") &&
                    !name.contains(":") && !name.contains("\0"), "Invalid update archive path.");
                for (String part : name.split("/")) {
                    require(!part.equals("..") && !part.equals("."), "Invalid update archive path.");
                }
                File output = new File(destination, name).getCanonicalFile();
                require(output.toPath().startsWith(destination.getCanonicalFile().toPath()) &&
                    !output.equals(destination.getCanonicalFile()) && names.add(output.getPath()),
                    "Duplicate or escaping update archive path.");
                if (entry.isDirectory()) {
                    require(entry.getSize() == 0, "Invalid archive directory entry.");
                    require(output.isDirectory() || output.mkdirs(), "Cannot create update directory.");
                    continue;
                }
                require(output.getParentFile().isDirectory() || output.getParentFile().mkdirs(),
                    "Cannot create update parent directory.");
                try (FileOutputStream stream = new FileOutputStream(output)) {
                    int count;
                    while ((count = zip.read(buffer)) != -1) {
                        expanded += count;
                        require(expanded <= MAX_EXPANDED_BYTES, "Expanded update exceeds the storage limit.");
                        stream.write(buffer, 0, count);
                    }
                }
            }
        }
        for (String required : new String[] {
            "index.html", "settings.html", "calculator.js", "settings.js", "extensions.bundle.js", "core.bundle.js"
        }) {
            require(new File(destination, required).isFile(), "Update is missing " + required + ".");
        }
    }

    static void remove(File file) throws IOException {
        if (!file.exists()) return;
        if (file.isDirectory() && !Files.isSymbolicLink(file.toPath())) {
            File[] children = file.listFiles();
            require(children != null, "Cannot list update files for cleanup.");
            for (File child : children) remove(child);
        }
        require(file.delete(), "Cannot remove update file: " + file.getName());
    }
}
