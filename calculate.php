<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_THROW_ON_ERROR);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Submit the calculator form using POST.']);
}

$submittedUnits = $_POST['units'] ?? null;
if (!is_string($submittedUnits) || !preg_match('/^\d+$/', $submittedUnits)) {
    respond(400, ['error' => 'Enter a whole number of units greater than or equal to zero.']);
}

$normalizedUnits = ltrim($submittedUnits, '0');
$normalizedUnits = $normalizedUnits === '' ? '0' : $normalizedUnits;
$units = filter_var($normalizedUnits, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 0],
]);

if ($units === false) {
    respond(400, ['error' => 'Enter a valid whole number of units.']);
}

$slabs = [
    ['label' => 'First 50 units', 'limit' => 50, 'rate' => 3.50],
    ['label' => 'Next 100 units', 'limit' => 100, 'rate' => 4.00],
    ['label' => 'Next 100 units', 'limit' => 100, 'rate' => 5.20],
    ['label' => 'Above 250 units', 'limit' => null, 'rate' => 6.50],
];

$remainingUnits = $units;
$bill = 0.0;
$breakdown = [];

foreach ($slabs as $slab) {
    if ($remainingUnits === 0) {
        break;
    }

    $slabUnits = $slab['limit'] === null
        ? $remainingUnits
        : min($remainingUnits, $slab['limit']);
    $amount = $slabUnits * $slab['rate'];
    $breakdown[] = [
        'label' => $slab['label'],
        'units' => $slabUnits,
        'rate' => $slab['rate'],
        'amount' => $amount,
    ];
    $bill += $amount;
    $remainingUnits -= $slabUnits;
}

respond(200, [
    'units' => $units,
    'bill' => $bill,
    'breakdown' => $breakdown,
]);
