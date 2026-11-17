fn main() {
    let name = "solanaceae";
    let blooms = ["marigold", "rose", "peony", "tulip", "daisy", "poppy", "bell"];
    println!("{} - {} species in the garden", name, blooms.len());

    std::hint::black_box(&CONTACTS);
}

static CONTACTS: [[u8; 24]; 4] = [
    *b"solanaceae@duck.com\0\0\0\0\0",
    *b"github.com/0xSolanaceae\0",
    *b"discord://0x_Solanaceae\0",
    *b"pgp.asc\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0",
];
