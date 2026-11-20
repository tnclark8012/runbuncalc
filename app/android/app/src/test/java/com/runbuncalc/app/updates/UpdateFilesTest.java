package com.runbuncalc.app.updates;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import org.json.JSONObject;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 37)
public class UpdateFilesTest {
    @Rule public TemporaryFolder temporary = new TemporaryFolder();

    private File zip(String... names) throws Exception {
        File archive = temporary.newFile();
        try (ZipOutputStream zip = new ZipOutputStream(new FileOutputStream(archive))) {
            for (String name : names) {
                zip.putNextEntry(new ZipEntry(name));
                zip.write(new byte[] {1, 2, 3});
                zip.closeEntry();
            }
        }
        return archive;
    }

    @Test
    public void verifiesSizeAndHashBeforeExtractingCompleteBundleAtArchiveRoot() throws Exception {
        File archive = zip("index.html", "settings.html", "calculator.js", "settings.js", "extensions.bundle.js", "core.bundle.js");
        UpdateFixture fixture = new UpdateFixture();
        JSONObject payload = fixture.payload(123);
        payload.getJSONObject("bundle").put("size", archive.length()).put("sha256",
            HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(archive.toPath()))));
        UpdateManifest manifest = UpdateManifest.verify(fixture.sign(payload), 2, fixture.publicKey);
        UpdateFiles.verifyArchive(archive, manifest);
        File output = new File(temporary.getRoot(), "complete");
        UpdateFiles.extract(archive, output);
        assertTrue(new File(output, "index.html").isFile());
        assertEquals(3, new File(output, "calculator.js").length());
        byte[] original = Files.readAllBytes(archive.toPath());
        byte[] changed = original.clone();
        changed[0] ^= 1;
        Files.write(archive.toPath(), changed);
        assertThrows(IOException.class, () -> UpdateFiles.verifyArchive(archive, manifest));
        Files.write(archive.toPath(), new byte[] {1});
        assertThrows(IOException.class, () -> UpdateFiles.verifyArchive(archive, manifest));
    }

    @Test
    public void rejectsTraversalAliasesAndMissingEntrypoints() throws Exception {
        for (String name : new String[] {"../escape", "/absolute", "a/../../escape", "a\\escape", "a/./b", "C:/file"}) {
            File archive = zip(name);
            assertThrows(name, IOException.class, () -> UpdateFiles.extract(archive,
                new File(temporary.getRoot(), "output-" + archive.getName())));
        }
        File alias = zip("a//b", "a/b");
        assertThrows(IOException.class, () -> UpdateFiles.extract(alias, new File(temporary.getRoot(), "alias")));
        File incomplete = zip("index.html");
        assertThrows(IOException.class, () -> UpdateFiles.extract(incomplete, new File(temporary.getRoot(), "incomplete")));
    }

    @Test
    public void rejectsZipBombsAndExcessiveFileCounts() throws Exception {
        File bomb = temporary.newFile();
        try (ZipOutputStream zip = new ZipOutputStream(new FileOutputStream(bomb))) {
            zip.putNextEntry(new ZipEntry("large"));
            byte[] chunk = new byte[1024 * 1024];
            for (int i = 0; i <= 256; i++) zip.write(chunk);
        }
        assertThrows(IOException.class, () -> UpdateFiles.extract(bomb, new File(temporary.getRoot(), "bomb")));
        File many = temporary.newFile();
        try (ZipOutputStream zip = new ZipOutputStream(new FileOutputStream(many))) {
            for (int i = 0; i <= UpdateFiles.MAX_ENTRIES; i++) {
                zip.putNextEntry(new ZipEntry("file-" + i));
                zip.closeEntry();
            }
        }
        assertThrows(IOException.class, () -> UpdateFiles.extract(many, new File(temporary.getRoot(), "many")));
    }
}
