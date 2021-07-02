use rand
#[derive(Clone, Copy)]
enum Suit {
    Heart,
    Tile,
    Clover,
    Pike,
    Joker,
}

type Hand = (Suit, u8);

enum CardEffect {
    SandStorm,
    FourStop,
    FiveSkip,
    Rokurokubi,
    SevenGiven,
    EightCut,
    NineReverse,
    TenThrow,
    ElevenBack,
    QueenBomber,
}
struct Env {
    revolution: bool,
    pass_limit: u8,
}

struct Game {
    players: Vec<Player>,
    env: Env,
    history: Vec<Hand>,
}
struct Player {
    name: String,
    order: u8,
    hands: Vec<Hand>,
    grade: i8,
    pass_count: u8,
}

fn check_hands(first: Vec<Hand>, last: Vec<Hand>, env: &Env) -> Result<bool, &str> {
    if first.iter().position(|x| x.1 != first[0].1) != None {
        return Err("First hands,Not same card.");
    }
    if last.iter().position(|x| x.1 != last[0].1) != None {
        return Err("Last hands,Not same card.");
    }

    first_wins_or_not(first[0], last[0], env)
}

// first wins or not
fn first_wins_or_not(first: Hand, last: Hand, env: &Env) -> Result<bool, &str> {
    let first_num = if first.1 == 1 || first.1 == 2 {
        first.1 + 13
    } else {
        first.1
    };

    let last_num = if last.1 == 1 || last.1 == 2 {
        last.1 + 13
    } else {
        last.1
    };

    if first_num > last_num {
        Ok(true ^ env.revolution) // XOR!
    } else if first_num < last_num {
        Ok(false ^ env.revolution) // XOR!
    } else {
        Err("Can't compare hands")
    }
}

impl Player {
    fn init() {}
}
impl Game {
    fn init_check() -> bool {}
    fn deal(&self) {
        use Suit::*;
        let card_pool = [
            (Joker,0),
            (Joker,0)
            (Heart, 1),
            (Heart, 2),
            (Heart, 3),
            (Heart, 4),
            (Heart, 5),
            (Heart, 6),
            (Heart, 7),
            (Heart, 8),
            (Heart, 9),
            (Heart, 10),
            (Heart, 11),
            (Heart, 12),
            (Heart, 13),
            (Tile, 1),
            (Tile, 2),
            (Tile, 3),
            (Tile, 4),
            (Tile, 5),
            (Tile, 6),
            (Tile, 7),
            (Tile, 8),
            (Tile, 9),
            (Tile, 10),
            (Tile, 11),
            (Tile, 12),
            (Tile, 13),
            (Clover, 1),
            (Clover, 2),
            (Clover, 3),
            (Clover, 4),
            (Clover, 5),
            (Clover, 6),
            (Clover, 7),
            (Clover, 8),
            (Clover, 9),
            (Clover, 10),
            (Clover, 11),
            (Clover, 12),
            (Clover, 13),
            (Pike, 1),
            (Pike, 2),
            (Pike, 3),
            (Pike, 4),
            (Pike, 5),
            (Pike, 6),
            (Pike, 7),
            (Pike, 8),
            (Pike, 9),
            (Pike, 10),
            (Pike, 11),
            (Pike, 12),
            (Pike, 13),
        ];

        
    }
}

#[test]
fn hand_test() {
    let env = Env {
        revolution: false,
        pass_limit: 0,
    };
    assert_eq!(
        first_wins_or_not((Suit::Clover, 1), (Suit::Clover, 3), &env),
        Ok(true)
    );
    assert_eq!(
        first_wins_or_not((Suit::Clover, 13), (Suit::Clover, 1), &env),
        Ok(false)
    );
    assert_eq!(
        first_wins_or_not((Suit::Clover, 13), (Suit::Clover, 13), &env),
        Err("Can't compare hands")
    );

    //after revolution
    let env = Env {
        revolution: true,
        pass_limit: 0,
    };
    assert_eq!(
        first_wins_or_not((Suit::Clover, 13), (Suit::Clover, 1), &env),
        Ok(true)
    );
}

#[test]
fn test_card() {
    let env = Env {
        revolution: false,
        pass_limit: 4,
    };
    assert_eq!(
        check_hands(
            vec![(Suit::Heart, 1), (Suit::Heart, 2)],
            vec![(Suit::Heart, 1), (Suit::Heart, 1)],
            &env
        ),
        Err("First hands,Not same card.")
    );

    assert_eq!(
        check_hands(
            vec![(Suit::Heart, 1), (Suit::Tile, 1)],
            vec![(Suit::Heart, 1), (Suit::Heart, 2)],
            &env
        ),
        Err("Last hands,Not same card.")
    );

    assert_eq!(
        check_hands(
            vec![(Suit::Heart, 2), (Suit::Heart, 2)],
            vec![(Suit::Heart, 1), (Suit::Heart, 1)],
            &env
        ),
        Ok(true)
    );

    assert_eq!(
        check_hands(
            vec![(Suit::Heart, 8), (Suit::Heart, 8)],
            vec![(Suit::Heart, 1), (Suit::Heart, 1)],
            &env
        ),
        Ok(false)
    );
}

fn player_test() {
    let p1 = Player {
        name: "P1".to_string(),
        order: 1,
        hands: vec![],
        grade: 0,
        pass_count: 0,
    };
    let p2 = Player {
        name: "P2".to_string(),
        order: 2,
        hands: vec![],
        grade: 0,
        pass_count: 0,
    };
}
