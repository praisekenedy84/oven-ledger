import PageHeader from '@/Components/PageHeader';
import TenantLayout from '@/Layouts/TenantLayout';
import {
    Divider,
    List,
    ListItem,
    ListItemText,
    Paper,
    Typography,
} from '@mui/material';
import { Head } from '@inertiajs/react';

export default function Show({ recipe }) {
    return (
        <TenantLayout title={recipe.product?.name ?? 'Recipe'}>
            <Head title="Recipe" />

            <PageHeader
                title={recipe.product?.name ?? 'Recipe'}
                description={`Expected yield: ${recipe.expected_yield}`}
                backHref={route('tenant.recipes.index')}
            />

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                    Ingredients
                </Typography>
                <List sx={{ mt: 1 }}>
                    {recipe.ingredients?.map((ing, index) => (
                        <BoxItem key={ing.id} showDivider={index > 0}>
                            <ListItem
                                secondaryAction={
                                    <Typography variant="body2" color="text.secondary">
                                        {ing.quantity} {ing.unit}
                                    </Typography>
                                }
                            >
                                <ListItemText
                                    primary={ing.raw_material?.name}
                                    primaryTypographyProps={{ fontWeight: 600 }}
                                />
                            </ListItem>
                        </BoxItem>
                    ))}
                </List>
            </Paper>
        </TenantLayout>
    );
}

function BoxItem({ children, showDivider }) {
    return (
        <>
            {showDivider && <Divider component="li" />}
            {children}
        </>
    );
}
