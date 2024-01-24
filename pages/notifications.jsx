import {
  Avatar,
  Paper,
  Group,
  Text,
  Space,
  Center,
  Divider,
  Container,
  Loader,
  Button,
  UnstyledButton,
  Notification,
  ActionIcon,
  Badge
} from "@mantine/core";
import { useState, useContext, useEffect } from "react";
import { DeSoIdentityContext } from "react-deso-protocol";
import { getNotifications, getSingleProfile, identity, getAppState, getUnreadNotificationsCount } from "deso-protocol";
import Link from 'next/link';
import { GiWaveCrest } from "react-icons/gi";
import {
  IconHeartPlus,
  IconHeart,
  IconUsers,
  IconMessage2,
  IconDiamond,
  IconRecycle,
  IconAt,
  IconCoin,
  IconThumbUp,
  IconThumbUpFilled,
  IconCoinOff,
  IconMoneybag
} from "@tabler/icons-react";
import { BiRepost } from "react-icons/bi";


export default function NotificationsPage () {
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useContext(DeSoIdentityContext);
  const [notifications, setNotifications] = useState([]);
  const userPublicKey = currentUser?.PublicKeyBase58Check;
  const [usd, setUSD] = useState(null);





  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const notificationData = await getNotifications({
        PublicKeyBase58Check: userPublicKey,
        NumToFetch: 100,
        FetchStartIndex: -1,
      });

  // Iterate through the notifications and fetch the usernames
  const updatedNotifications = await Promise.all(
    notificationData.Notifications.map(async (notification) => {
      const request = {
        PublicKeyBase58Check: notification.Metadata.TransactorPublicKeyBase58Check,
        NoErrorOnMissing: true,
      };
      const profileResponse = await getSingleProfile(request);

      let username = 'anon'; // Default to 'anon' in case of an error
      if (profileResponse && profileResponse.Profile && profileResponse.Profile.Username) {
        username = profileResponse.Profile.Username;
      }

      return {
        ...notification,
        username,
      };
    })
  );
      
      setNotifications(updatedNotifications);
      
      setIsLoading(false); 

     
    } catch (error) {
      notifications.show({
        title: "Error",
        icon: <IconX size="1.1rem" />,
        color: "red",
        message: "Something Happened!",
      });
      console.error("Error fetching user notifications:", error);
      setIsLoading(false); 
    }
  };


  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const appState = await getAppState({ PublicKeyBase58Check: "BC1YLjYHZfYDqaFxLnfbnfVY48wToduQVHJopCx4Byfk4ovvwT6TboD" });
        const desoUSD = appState?.USDCentsPerDeSoCoinbase / 100;

        setUSD(desoUSD);
      
      } catch (error) {
        console.error('Error fetching app state:', error);
      }
    };

    fetchData();
  }, [notifications]);

  const convertToUSD = (nanos) => {
    try {
      const nanoToDeso = 0.000000001;
      const deso = nanos * nanoToDeso;
      let usdValue = deso * usd;

      if (usdValue < 0.01) {
        usdValue = 0.01;
      }

      return usdValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    } catch (error) {
      console.error('Error converting Nanos to USD:', error);
      return null;
    }
  };

  

  return (
    <div>
      <Divider
        my="xs"
        label={
          <>
            <Text fw={444} fz="xl">
              Notifications
            </Text>
          </>
        }
        labelPosition="center"
      />

      {!currentUser && (
        <>
          <Space h="xl" />
          <Container size="30rem" px={0}>
            <Paper shadow="xl" p="lg" withBorder>
              <Center>
                <Text c="dimmed" fw={700}>
                  Please Sign Up or Sign In to view your Notifications.
                </Text>
              </Center>
              <Space h="md" />
              <Center>
                <Button
                  fullWidth
                  leftSection={<GiWaveCrest size="1rem" />}
                  variant="gradient"
                  gradient={{ from: "cyan", to: "indigo" }}
                  onClick={() => identity.login()}
                >
                  Sign Up
                </Button>
                <Space w="xs" />
                <Button
                  fullWidth
                  variant="default"
                  onClick={() => identity.login()}
                >
                  Sign In
                </Button>
              </Center>
            </Paper>
          </Container>
        </>
      )}

      
      

        {currentUser && isLoading ? (
           <Center>
           <Loader variant="bars" />
          </Center>
          ) : (
            notifications.map((notification, index) => (
              <>
                <Container key={index}>
                    {notification.Metadata.TxnType === "CREATE_POST_ASSOCIATION" && notification.Metadata.CreatePostAssociationTxindexMetadata.AssociationValue === "LIKE" && (
                      <>
                      <Notification withCloseButton={false} withBorder radius="md" color='rgba(255, 25, 251, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%" }}
                              component={Link}
                              href={`/post/${notification.Metadata.CreatePostAssociationTxindexMetadata.PostHashHex}`}
                              variant="gradient"
                                size="xl"
                                aria-label="Gradient action icon"
                                gradient={{ from: 'blue', to: 'rgba(255, 25, 251, 1)', deg: 298 }}
                                                    >
                            <IconThumbUp />
                            <Space w='sm'/>
                            <Text fw={500} size="sm">
                          Liked your post
                        </Text>
                          </ActionIcon>
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                               </>}>
                        </Notification>
                      
                      </>
                    )}

          {notification.Metadata.TxnType === "CREATE_POST_ASSOCIATION" && notification.Metadata?.CreatePostAssociationTxindexMetadata.AssociationValue === "LOVE" && (
                      <>
                       <Notification withCloseButton={false} withBorder radius="md" color="red" title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata?.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                            style={{ width: "100%", height: "100%" }}
                            component={Link}
                            href={`/post/${notification.Metadata?.CreatePostAssociationTxindexMetadata?.PostHashHex}`}
                            variant="gradient"
                            size="xl"
                            aria-label="Gradient action icon"
                            gradient={{ from: 'blue', to: 'pink', deg: 298 }}
                          >
                            <IconHeartPlus />
                            <Space w='md'/>
                            <Text fw={500} size="sm">
                          Loved your post
                        </Text>
                          </ActionIcon>
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                               </>}>
                        </Notification>
                      </>
                    )}

                    {notification.Metadata.TxnType === "LIKE" && (
                      <>
                      <Notification withCloseButton={false} withBorder radius="md" color='rgba(255, 25, 251, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%" }}
                              component={Link}
                              href={`/post/${notification.Metadata.LikeTxindexMetadata.PostHashHex}`}
                              variant="gradient"
      size="xl"
      aria-label="Gradient action icon"
      gradient={{ from: 'blue', to: 'rgba(255, 25, 251, 1)', deg: 298 }}
                          >
                           <IconThumbUpFilled/>
                            <Space w='sm'/>
                        <Text fw={500} size="sm">
                          Liked your post
                        </Text>
                        
                        
                          </ActionIcon>
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                      </>
                    )}
                    {notification.Metadata.TxnType === "FOLLOW" && (
                     <>
                      <Notification withCloseButton={false} withBorder radius="md" color='rgba(255, 112, 146, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%", padding: "10px" }}
                              component={Link}
                              href={`/wave/${notification.username}`}
                              variant="gradient"
                              size="xl"
                              aria-label="Gradient action icon"
                              gradient={{ from: 'rgba(255, 112, 146, 1)', to: 'blue', deg: 90 }}
                          >
                            <IconUsers />
                            <Space w='md'/>
                        <Text fw={500} size="sm">
                          Followed You
                        </Text>
                          </ActionIcon>
                          
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                     </>
                    )}
                    {notification.Metadata.TxnType === "SUBMIT_POST" &&
                      notification.Metadata.AffectedPublicKeys[0].Metadata ===
                        "RepostedPublicKeyBase58Check" && (
                        <>
                          <Notification withCloseButton={false} withBorder radius="md" color='rgba(255, 110, 13, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%", padding: "10px" }}
                              component={Link}
                              href={`/post/${notification.Metadata.SubmitPostTxindexMetadata.PostHashBeingModifiedHex}`}
                              variant="gradient"
                              size="xl"
                              aria-label="Gradient action icon"
                              gradient={{ from: 'rgba(255, 110, 13, 1)', to: 'blue', deg: 90 }}
                          >
                            <IconRecycle/>
                            <Space w='md'/>
                        <Text fw={500} size="sm">
                          Reposted
                        </Text>
                          </ActionIcon>
                          
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                        </>
                      )}
                    {notification.Metadata.TxnType === "SUBMIT_POST" &&
                      notification.Metadata.AffectedPublicKeys.length >= 2 &&
                      notification.Metadata.AffectedPublicKeys[0].Metadata ===
                        "BasicTransferOutput" &&
                      notification.Metadata.AffectedPublicKeys[1].Metadata ===
                        "MentionedPublicKeyBase58Check" && (
                        <>
                         <Notification withCloseButton={false} withBorder radius="md" color='rgba(59, 247, 42, 1)'title={<>
                          <UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    
                    
                    <Group>
                    
                      <ActionIcon
                          style={{ width: "100%", height: "100%", padding: "10px" }}
                          component={Link}
                          href={`/post/${notification.Metadata.SubmitPostTxindexMetadata.PostHashBeingModifiedHex}`}
                          variant="gradient"
                          size="xl"
                          aria-label="Gradient action icon"
                          gradient={{ from: 'rgba(59, 247, 42, 1)', to: 'blue', deg: 90 }}
                        >
                        <IconAt/>
                        <Space w='md'/>
                    <Text fw={500} size="sm">
                      Mentioned You
                    </Text>
                      </ActionIcon>
                      
                </Group>
                          
                    
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                          
                        </>
                      )}

                    {notification.Metadata.TxnType === "SUBMIT_POST" &&
                      notification.Metadata.AffectedPublicKeys.length >= 2 &&
                      notification.Metadata.AffectedPublicKeys[1].Metadata ===
                        "ParentPosterPublicKeyBase58Check" && (
                        <>
                           <Notification withCloseButton={false} withBorder radius="md" color='rgba(255, 244, 25, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%" }}
                              component={Link}
                              href={`/post/${notification.Metadata.SubmitPostTxindexMetadata.ParentPostHashHex}`}
                              variant="gradient"
                              size="xl"
                              aria-label="Gradient action icon"
                              gradient={{ from: 'blue', to: 'rgba(255, 244, 25, 1)', deg: 298 }}
                          >
                           <IconMessage2/>
                            <Space w='sm'/>
                        <Text fw={500} size="sm">
                          Commented
                        </Text>
                        
                        
                          </ActionIcon>
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                        </>
                      )}
                    {notification.Metadata.TxnType === "SUBMIT_POST" &&
                      notification.Metadata.AffectedPublicKeys[0].Metadata ===
                        "MentionedPublicKeyBase58Check" && (
                        <>
                             <Notification withCloseButton={false} withBorder radius="md" color='rgba(59, 247, 42, 1)'title={<>
                             <UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%", padding: "10px" }}
                              component={Link}
                              href={`/post/${notification.Metadata.SubmitPostTxindexMetadata.PostHashBeingModifiedHex}`}
                              variant="gradient"
                              size="xl"
                              aria-label="Gradient action icon"
                              gradient={{ from: 'rgba(59, 247, 42, 1)', to: 'blue', deg: 90 }}
                          >
                            <IconAt/>
                            <Space w='md'/>
                        <Text fw={500} size="sm">
                          Mentioned You
                        </Text>
                          </ActionIcon>
                          
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                        </>
                      )}
                    {notification.Metadata.TxnType === "SUBMIT_POST" &&
                      notification.Metadata.AffectedPublicKeys[0].Metadata ===
                        "ParentPosterPublicKeyBase58Check" && (
                        <>
                          <Notification withCloseButton={false} withBorder radius="md" color='rgba(255, 244, 25, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%" }}
                              component={Link}
                              href={`/post/${notification.Metadata.SubmitPostTxindexMetadata.ParentPostHashHex}`}
                              variant="gradient"
      size="xl"
      aria-label="Gradient action icon"
      gradient={{ from: 'blue', to: 'rgba(255, 244, 25, 1)', deg: 298 }}
                          >
                           <IconMessage2/>
                            <Space w='sm'/>
                        <Text fw={500} size="sm">
                          Commented
                        </Text>
                        
                        
                          </ActionIcon>
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                        </>
                      )}

{notification.Metadata.BasicTransferTxindexMetadata &&
  notification.Metadata.BasicTransferTxindexMetadata.DiamondLevel > 0 && (
    <>
     <Notification withCloseButton={false} withBorder radius="md" color='rgba(42, 247, 199, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%" }}
                        component={Link}
                        href={`/post/${notification.Metadata.BasicTransferTxindexMetadata.PostHashHex}`}
                              variant="gradient"
      size="xl"
      aria-label="Gradient action icon"
      gradient={{ from: 'blue', to: 'rgba(42, 247, 199, 1)', deg: 298 }}
                          >
                           <IconDiamond/>
                            <Space w='sm'/>
                            <Text fw={500} size="sm">
      Tipped {convertToUSD(notification?.Metadata?.BasicTransferTxindexMetadata?.TotalOutputNanos)} in Diamonds
    </Text>
                        
                        
                          </ActionIcon>
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>

      
    </>
  
)}

                    {notification.Metadata.TxnType === "CREATOR_COIN" &&
                      notification.Metadata.CreatorCoinTxindexMetadata
                        .OperationType === "buy" && (
                        <>
                        <Notification withCloseButton={false} withBorder radius="md" color='rgba(42, 247, 199, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%" }}
                        variant="gradient"
                        size="xl"
                        aria-label="Gradient action icon"
                        gradient={{ from: 'blue', to: 'rgba(42, 247, 199, 1)', deg: 298 }}
                          >
                            <IconCoin />
                            <Space w='sm'/>
                            <Text fw={500} size="sm">Bought {convertToUSD(notification?.Metadata?.BasicTransferTxindexMetadata?.TotalOutputNanos)} of your Creator Coin</Text>
                            
                          </ActionIcon>
                         
                    </Group>

                    
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>

                        </>
                      )}

                    {notification.Metadata.TxnType === "CREATOR_COIN" &&
                      notification.Metadata.CreatorCoinTxindexMetadata
                        .OperationType === "sold" && (
                        <>
                          <Notification withCloseButton={false} withBorder radius="md" color='rgba(42, 247, 199, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                            style={{ width: "100%", height: "100%" }}
                            variant="gradient"
                            size="xl"
                            aria-label="Gradient action icon"
                            gradient={{ from: 'blue', to: 'rgba(42, 247, 199, 1)', deg: 298 }}
                          >
                            <IconCoinOff />
                            <Space w='sm'/>
                            <Text fw={500} size="sm">Sold {convertToUSD(notification?.Metadata?.BasicTransferTxindexMetadata?.TotalOutputNanos)} of your Creator Coin</Text>

                          </ActionIcon>
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                        </>
                      )}
                    {notification.Metadata.TxnType === "BASIC_TRANSFER" &&
                      notification.Metadata.AffectedPublicKeys[0].Metadata ===
                        "BasicTransferOutput" &&
                      notification.Metadata.AffectedPublicKeys[0]
                        .PublicKeyBase58Check ===
                        currentUser.PublicKeyBase58Check &&  notification.Metadata.BasicTransferTxindexMetadata
                        .DiamondLevel === 0 && (
                        <>
                         <Notification withCloseButton={false} withBorder radius="md" color='rgba(42, 247, 199, 1)' title={<><UnstyledButton component={Link} href={`/wave/${notification.username}`}>
                      <Group style={{ width: "100%", flexGrow: 1 }}>
                        <Avatar
                          size="md"
                          src={
                            `https://node.deso.org/api/v0/get-single-profile-picture/${notification.Metadata.TransactorPublicKeyBase58Check}` ||
                            null
                          }
                        />
                        <div>
                          <Text c="dimmed" fw={700} size="md">
                            {notification.username}
                          </Text>
                        </div>
                        
                      </Group>
                    </UnstyledButton> 
                    <Space h='md'/>
                    <Group>
                    
                        <ActionIcon
                        style={{ width: "100%", height: "100%" }}
                     
                              variant="gradient"
      size="xl"
      aria-label="Gradient action icon"
      gradient={{ from: 'blue', to: 'rgba(42, 247, 199, 1)', deg: 298 }}
                          >
                            <IconMoneybag />
                            <Space w='sm'/>
                            <Text fw={500} size="sm">Sent you DeSo</Text>

                          </ActionIcon>
                    </Group>
                    <Space h='md'/>

                        <Group>
                         
                        </Group>
                       
                        </>}>

                        </Notification>
                        </>
                      )}
                 </Container>
              </>
            ))
          )}
  
          <Space h={222} />

    </div>
    
  );
};