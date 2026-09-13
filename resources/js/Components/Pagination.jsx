import { Button, Stack } from '@mui/material';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
            justifyContent={{ xs: 'center', sm: 'flex-end' }}
            sx={{ mt: 3 }}
        >
            {links.map((link, index) => {
                const disabled = !link.url;
                const content = (
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                );

                if (disabled) {
                    return (
                        <Button
                            key={index}
                            size="small"
                            disabled
                            variant="outlined"
                            sx={{ minWidth: 40, minHeight: 40 }}
                        >
                            {content}
                        </Button>
                    );
                }

                return (
                    <Button
                        key={index}
                        component={Link}
                        href={link.url}
                        preserveScroll
                        prefetch
                        size="small"
                        variant={link.active ? 'contained' : 'outlined'}
                        color={link.active ? 'primary' : 'inherit'}
                        sx={{ minWidth: 40, minHeight: 40 }}
                    >
                        {content}
                    </Button>
                );
            })}
        </Stack>
    );
}
