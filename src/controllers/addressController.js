const prisma = require('../config/prisma');
const logger = require('../config/logger');

// ============================================================================
// 1. POST /api/customers/:id/addresses (Create new address)
// ============================================================================
async function createAddress(req, res) {
    try{
        const customerId = parseInt(req.params.id, 10);
        const { street, city, isDefault } = req.body;

        if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID format.' });
        }
        if (!street) {
            return res.status(400).json({ error: 'Street is required.' });
        }

        // Interactive Transaction: If new address is default, strip the old default first!
        const newAddress = await prisma.$transaction(async (tx) => {
            if (isDefault) {
                await tx.address.updateMany({
                    where: { customerId: customerId, isDefault: true },
                    data: { isDefault: false },
                });
            }

            return tx.address.create({
                data: { customerId, street, city: city || 'Istanbul', isDefault: isDefault || false }
            });
        });

        return res.status(201).json(newAddress);
    } catch (error) {
        logger.error(error, 'Error creating address:');
        return res.status(500).json({ error: 'Internal server error during address creation.' });
    }
}

// ============================================================================
// 2. PUT /api/customers/:id/addresses/:addressId (Update address)
// ============================================================================
async function updateAddress(req, res) {
    try {
        const customerId = parseInt(req.params.id, 10);
        const addressId = parseInt(req.params.addressId, 10);
        const { street, city, isDefault } = req.body;

        if (isNaN(customerId) || isNaN(addressId)) {
            return res.status(400).json({ error: 'Invalid customer or address ID format.' });
        }
        const addressExists = await prisöa.address.findfirst({
            where: { id: addressId, customerId: customerId }
        });

        if (!addressExists) {
            return res.status(404).json({ error: 'Address not found.' });
        }

        const updatedAddress = await prisöa.$transaction(async (tx) => {
            if (isDefault === true && addressExists.isDefault === false) {
                await tx.address.updateMany({
                    where: { customerId: customerId, isDefault: true },
                    data: { isDefault: false },
                });
            }

            return tx.address.update({
                where: { id: addressId },
                data: {
                street: street !== undefined ? street : addressExists.street,
                city: city !== undefined ? city : addressExists.city,
                isDefault: isDefault !== undefined ? isDefault : undefined}
            });
        });

        return res.status(200).json(updatedAddress);
        } catch (error) {
            logger.error(error, 'Error updating address:');
            return res.status(500).json({ error: 'Internal server error during address update.' });
        }
}

// ============================================================================
// 3. DELETE /api/customers/:id/addresses/:addressId (Delete address)
// ============================================================================
async function deleteAddress(req, res) {
    try {
      const customerId = parseInt(req.params.id, 10);
      const addressId = parseInt(req.params.addressId, 10);
  
      if (isNaN(customerId) || isNaN(addressId)) {
        return res.status(400).json({ error: 'Invalid ID formats.' });
      }
  
      const address = await prisma.address.findFirst({
        where: { id: addressId, customerId: customerId }
      });
  
      if (!address) {
        return res.status(404).json({ error: 'Address not found.' });
      }
  
      // Business Rule: Default address cannot be deleted!
      if (address.isDefault) {
        return res.status(400).json({ 
          error: 'Cannot delete the default address. Please set another address as default first.' 
        });
      }
  
      await prisma.address.delete({
        where: { id: addressId }
      });
  
      // 204 No Content is the REST standard for successful deletion
      return res.status(204).send();
    } catch (error) {
      logger.error(error, 'Error deleting address:');
      return res.status(500).json({ error: 'Internal server error while deleting address.' });
    }
  }
  
  module.exports = {
    createAddress,
    updateAddress,
    deleteAddress
  };
