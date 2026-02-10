pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template HandIntegrity() {
    // Private Inputs
    signal input hand;          // 0: Rock, 1: Paper, 2: Scissors
    signal input nonce;         // Random salt
    
    // Public Inputs
    signal input playerPubKeyHash; // Binding to player identity
    signal input roundNumber;      // Binding to specific round
    signal input handCommit;       // The public commitment to match

    // 1. Verify Hand is valid (0, 1, or 2)
    // Constraint: hand * (hand - 1) * (hand - 2) === 0
    // Split into:
    // s1 <== hand * (hand - 1)
    // s1 * (hand - 2) === 0
    signal s1;
    s1 <== hand * (hand - 1);
    s1 * (hand - 2) === 0;

    // 2. Compute the commitment
    // Poseidon(hand, nonce, playerPubKeyHash, roundNumber)
    component poseidon = Poseidon(4);
    poseidon.inputs[0] <== hand;
    poseidon.inputs[1] <== nonce;
    poseidon.inputs[2] <== playerPubKeyHash;
    poseidon.inputs[3] <== roundNumber;

    // 3. Verify it matches the public input
    poseidon.out === handCommit;
}

component main {public [playerPubKeyHash, roundNumber, handCommit]} = HandIntegrity();
