// The program whose string table the plate is cut from.
//
//   rustc -O garden.rs -o garden.exe
//
// The plate shows 672 bytes at file offset 0xa2040 of that binary: the Rust
// backtrace and std::path strings, with rows 4, 8, 12 and 16 showing the
// CONTACTS table below instead of the bytes found there.

fn main() {
    let name = "solanaceae";
    let blooms = ["marigold", "rose", "peony", "tulip", "daisy", "poppy", "bell"];
    println!("{} - {} species in the garden", name, blooms.len());

    // Keeping the table alive is the only reason it is in the binary.
    std::hint::black_box(&CONTACTS);
}

// One contact per row, NUL padded to the plate's 24 bytes.
static CONTACTS: [[u8; 24]; 4] = [
    *b"solanaceae@duck.com\0\0\0\0\0",
    *b"github.com/0xSolanaceae\0",
    *b"discord://0x_Solanaceae\0",
    *b"pgp.asc\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0",
];
