package com.runbuncalc.app.storage;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.Test;

public class SaveFileReaderTest {
    private final SaveFileReader reader = new SaveFileReader();

    @Test
    public void hashesAllBytesUpToAndIncludingTheLimit() throws Exception {
        byte[] bytes = "abc".getBytes(StandardCharsets.UTF_8);
        SaveFileReader.Result result = reader.read(new ByteArrayInputStream(bytes), bytes.length);
        assertEquals(3, result.bytes);
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", result.sha256);
    }

    @Test
    public void rejectsOversizeInputRatherThanReturningAPartialHash() {
        SaveAccessException error = assertThrows(SaveAccessException.class,
            () -> reader.read(new ByteArrayInputStream(new byte[4]), 3));
        assertEquals("FILE_TOO_LARGE", error.code);
    }

    @Test
    public void propagatesReadFailuresRatherThanReturningSuccess() {
        InputStream broken = new InputStream() {
            @Override
            public int read() throws IOException {
                throw new IOException("Provider disconnected");
            }
        };
        assertThrows(IOException.class, () -> reader.read(broken, 10));
    }
}
