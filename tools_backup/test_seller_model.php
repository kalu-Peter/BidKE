<?php
require_once __DIR__ . '/../api/config/connect.php';

// Include the SellerProfile class but we need to manually define it to avoid path issues
class TestSellerProfile
{
    private $conn;
    private $table_name = "seller_profiles";
    public $id;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function createFromData($data)
    {
        $allowedFields = [
            'user_id',
            'business_name',
            'business_type',
            'verification_status',
            'business_verified'
        ];

        $insertFields = [];
        $placeholders = [];
        $values = [];

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $insertFields[] = $key;
                $placeholders[] = "?";
                if ($key === 'business_verified') {
                    $values[] = $value ? 'true' : 'false';
                } else {
                    $values[] = $value;
                }
            }
        }

        if (empty($insertFields)) {
            return false;
        }

        $query = "INSERT INTO " . $this->table_name . " (" . implode(", ", $insertFields) . ", created_at, updated_at) 
                  VALUES (" . implode(", ", $placeholders) . ", NOW(), NOW())";

        echo "SQL Query: " . $query . "\n";
        echo "Values: " . print_r($values, true) . "\n";

        $stmt = $this->conn->prepare($query);
        if ($stmt->execute($values)) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        echo "SQL Error: " . print_r($stmt->errorInfo(), true) . "\n";
        return false;
    }
}

try {
    echo "Testing SellerProfile creation directly...\n";

    $seller = new TestSellerProfile();
    $testData = [
        'user_id' => 2,
        'business_name' => 'Test Business',
        'business_type' => 'company',
        'verification_status' => 'pending',
        'business_verified' => false
    ];

    echo "Creating with data: " . print_r($testData, true) . "\n";

    $result = $seller->createFromData($testData);

    if ($result) {
        echo "SUCCESS: Seller profile created with ID: " . $seller->id . "\n";
    } else {
        echo "FAILED: Could not create seller profile\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
