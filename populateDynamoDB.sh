PRODUCTS_TABLE="Products"
STOCKS_TABLE="Stocks"

PRODUCTS=(
    '{"id": {"S": "7567ec4b-b10c-48c5-9345-fc73c48a80aa"}, "title": {"S": "ProductOne"}, "description": {"S": "Short Product Description1"}, "price": {"N": "24"}}'
    '{"id": {"S": "7567ec4b-b10c-48c5-9345-fc73c48a80a1"}, "title": {"S": "ProductTitle"}, "description": {"S": "Short Product Description7"}, "price": {"N": "15"}}'
    '{"id": {"S": "7567ec4b-b10c-48c5-9345-fc73c48a80a3"}, "title": {"S": "Product"}, "description": {"S": "Short Product Description2"}, "price": {"N": "23"}}'
    '{"id": {"S": "7567ec4b-b10c-48c5-9345-fc73348a80a1"}, "title": {"S": "ProductTest"}, "description": {"S": "Short Product Description4"}, "price": {"N": "15"}}'
    '{"id": {"S": "7567ec4b-b10c-48c5-9445-fc73c48a80a2"}, "title": {"S": "Product2"}, "description": {"S": "Short Product Descriptio1"}, "price": {"N": "23"}}'
    '{"id": {"S": "7567ec4b-b10c-45c5-9345-fc73c48a80a1"}, "title": {"S": "ProductName"}, "description": {"S": "Short Product Description7"}, "price": {"N": "15"}}'
)

STOCKS=(
    '{"product_id": {"S": "7567ec4b-b10c-48c5-9345-fc73c48a80aa"}, "count": {"N": "3"}}'
    '{"product_id": {"S": "7567ec4b-b10c-48c5-9345-fc73c48a80a1"}, "count": {"N": "4"}}'
    '{"product_id": {"S": "7567ec4b-b10c-48c5-9345-fc73c48a80a3"}, "count": {"N": "5"}}'
    '{"product_id": {"S": "7567ec4b-b10c-48c5-9345-fc73348a80a1"}, "count": {"N": "6"}}'
    '{"product_id": {"S": "7567ec4b-b10c-48c5-9445-fc73c48a80a2"}, "count": {"N": "7"}}'
    '{"product_id": {"S": "7567ec4b-b10c-45c5-9345-fc73c48a80a1"}, "count": {"N": "8"}}'
)

for product in "${PRODUCTS[@]}"; do
    aws dynamodb put-item --table-name $PRODUCTS_TABLE --item "$product"
done

for stock in "${STOCKS[@]}"; do
    aws dynamodb put-item --table-name $STOCKS_TABLE --item "$stock"
done

echo "Tables populated successfully"
