// The program whose string table the plate is cut from.
//
//   rustc -O garden.rs -o garden.exe
//
// The plate shows 672 bytes at file offset 0xa2040: the Rust backtrace and
// std::path strings, with the contact rows patched over rows 4, 8, 12, 16, 20.

fn main() {
    let name = "solanaceae";
    let blooms = ["marigold", "rose", "peony", "tulip", "daisy", "poppy", "bell"];
    println!("{} - {} species in the garden", name, blooms.len());
}
